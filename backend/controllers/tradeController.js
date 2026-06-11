const mongoose = require("mongoose");
const Trade = require("../models/Trade");
const Alert = require("../models/Alert");
const { risk_config, calculateRiskScore } = require("../services/riskEngine");
const { evaluatePreTradeRules } = require("../services/preTradeRiskEngine");
const { evaluateBehavioralRules } = require("../services/behavioralRiskEngine");
const {
    logBlockedTradeEvents,
    logAlertRuleEvents
} = require("../services/riskEventLogger");

const fs = require("fs");
const csv = require("csv-parser");

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const validateTradeInput = (body) => {
    let {
        traderId,
        traderName,
        stockSymbol,
        tradeType,
        quantity,
        price,
        tradeTime
    } = body;

    if (!traderId || !traderName || !stockSymbol || !tradeType || quantity === undefined || price === undefined) {
        return {
            isValid: false,
            message: "traderId, traderName, stockSymbol, tradeType, quantity, and price are required"
        };
    }

    tradeType = tradeType.toUpperCase();
    stockSymbol = stockSymbol.toUpperCase();

    if (!["BUY", "SELL"].includes(tradeType)) {
        return {
            isValid: false,
            message: "tradeType must be BUY or SELL"
        };
    }

    quantity = Number(quantity);
    price = Number(price);

    if (Number.isNaN(quantity) || quantity <= 0) {
        return {
            isValid: false,
            message: "quantity must be a positive number"
        };
    }

    if (Number.isNaN(price) || price <= 0) {
        return {
            isValid: false,
            message: "price must be a positive number"
        };
    }

    return {
        isValid: true,
        data: {
            traderId: traderId.trim(),
            traderName: traderName.trim(),
            stockSymbol: stockSymbol.trim(),
            tradeType,
            quantity,
            price,
            tradeTime: tradeTime || Date.now()
        }
    };
};

const buildTradeQuery = (queryParams) => {
    const {
        traderId,
        stockSymbol,
        tradeType,
        minValue,
        maxValue,
        startDate,
        endDate
    } = queryParams;

    const query = {};

    if (traderId) {
        query.traderId = traderId.trim();
    }

    if (stockSymbol) {
        query.stockSymbol = stockSymbol.toUpperCase().trim();
    }

    if (tradeType) {
        query.tradeType = tradeType.toUpperCase().trim();
    }

    if (minValue || maxValue) {
        query.tradeValue = {};

        if (minValue) {
            query.tradeValue.$gte = Number(minValue);
        }

        if (maxValue) {
            query.tradeValue.$lte = Number(maxValue);
        }
    }

    if (startDate || endDate) {
        query.tradeTime = {};

        if (startDate) {
            query.tradeTime.$gte = new Date(startDate);
        }

        if (endDate) {
            query.tradeTime.$lte = new Date(endDate);
        }
    }

    return query;
};

const getRecentTradesForRiskCheck = async (trade) => {
    const tradeTime = trade.tradeTime ? new Date(trade.tradeTime) : new Date();

    const windowStart = new Date(tradeTime.getTime() - 30 * 60 * 1000);

    const recentTrades = await Trade.find({
        traderId: trade.traderId,
        tradeTime: {
            $gte: windowStart,
            $lte: tradeTime
        }
    }).sort({
        tradeTime: -1
    });

    return recentTrades;
};

const getTrades = async (req, res) => {
    try {
        const query = buildTradeQuery(req.query);

        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
        const skip = (page - 1) * limit;

        const allowedSortFields = ["createdAt", "tradeTime", "tradeValue", "quantity", "price"];
        const sortBy = allowedSortFields.includes(req.query.sortBy) ? req.query.sortBy : "createdAt";
        const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

        const [trades, totalTrades] = await Promise.all([
            Trade.find(query)
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(limit),

            Trade.countDocuments(query)
        ]);

        res.status(200).json({
            message: "Fetched trades successfully",
            count: trades.length,
            totalTrades,
            currentPage: page,
            totalPages: Math.ceil(totalTrades / limit),
            data: trades
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch trades",
            error: error.message
        });
    }
};

const createTrade = async (req, res) => {
    try {
        const validation = validateTradeInput(req.body);

        if (!validation.isValid) {
            return res.status(400).json({
                message: validation.message
            });
        }

        const preTradeResult = await evaluatePreTradeRules(validation.data);

        if (preTradeResult.blocked) {
            await logBlockedTradeEvents(
                validation.data,
                preTradeResult.failedRules
            );

            return res.status(400).json({
                message: "Trade blocked by pre-trade risk controls",
                blocked: true,
                failedRules: preTradeResult.failedRules
            });
        }

        const trade = await Trade.create(validation.data);

        const recentTrades = await getRecentTradesForRiskCheck(trade);

        const riskResult = await evaluateBehavioralRules(trade, recentTrades);

        let alert = null;

        if (riskResult.isRisky) {
            alert = await Alert.create({
                tradeId: trade._id,
                traderId: trade.traderId,
                traderName: trade.traderName,
                stockSymbol: trade.stockSymbol,
                alertType:
                    riskResult.triggeredRules.length > 1
                        ? "MULTIPLE_RULES_TRIGGERED"
                        : riskResult.triggeredRules[0],
                severity: riskResult.severity,
                riskScore: riskResult.riskScore,
                triggeredRules: riskResult.triggeredRules,
                reasons: riskResult.reasons,
                message: `Trade flagged as ${riskResult.severity} risk due to: ${riskResult.reasons.join("; ")}`,
                status: "PENDING"
            });

            await logAlertRuleEvents({
                trade,
                alert,
                riskResult
            });
        }

        res.status(201).json({
            message: "Trade created successfully",
            data: {
                trade,
                alert,
                riskResult
            }
        });
    }
    catch (error) {
        res.status(400).json({
            message: "Failed to create trade",
            error: error.message
        });
    }
};

const parseCSVFile = (filePath) => {
    return new Promise((resolve, reject) => {
        const rows = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (row) => {
                rows.push(row);
            })
            .on("end", () => {
                resolve(rows);
            })
            .on("error", (error) => {
                reject(error);
            });
    });
};

const uploadTradesCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "CSV file is required"
            });
        }

        const rows = await parseCSVFile(req.file.path);

        let tradesSaved = 0;
        let alertsGenerated = 0;
        let blockedRows = 0;

        const failedRows = [];

        for (let i = 0; i < rows.length; i++) {
            try {
                const row = rows[i];

                const validation = validateTradeInput({
                    traderId: row.traderId,
                    traderName: row.traderName,
                    stockSymbol: row.stockSymbol,
                    tradeType: row.tradeType,
                    quantity: row.quantity,
                    price: row.price,
                    tradeTime: row.tradeTime
                });

                if (!validation.isValid) {
                    failedRows.push({
                        rowNumber: i + 1,
                        reason: validation.message,
                        row
                    });

                    continue;
                }

                const preTradeResult = await evaluatePreTradeRules(validation.data);

                if (preTradeResult.blocked) {
                    blockedRows++;

                    await logBlockedTradeEvents(
                        validation.data,
                        preTradeResult.failedRules
                    );

                    failedRows.push({
                        rowNumber: i + 1,
                        reason: "Blocked by pre-trade risk controls",
                        failedRules: preTradeResult.failedRules,
                        row
                    });

                    continue;
                }

                const trade = await Trade.create(validation.data);

                const recentTrades = await getRecentTradesForRiskCheck(trade);

                const riskResult = await evaluateBehavioralRules(trade, recentTrades);

                if (riskResult.isRisky) {
                    const alert = await Alert.create({
                        tradeId: trade._id,
                        traderId: trade.traderId,
                        traderName: trade.traderName,
                        stockSymbol: trade.stockSymbol,
                        alertType:
                            riskResult.triggeredRules.length > 1
                                ? "MULTIPLE_RULES_TRIGGERED"
                                : riskResult.triggeredRules[0],
                        severity: riskResult.severity,
                        riskScore: riskResult.riskScore,
                        triggeredRules: riskResult.triggeredRules,
                        reasons: riskResult.reasons,
                        message: `Trade flagged as ${riskResult.severity} risk due to: ${riskResult.reasons.join("; ")}`,
                        status: "PENDING"
                    });

                    await logAlertRuleEvents({
                        trade,
                        alert,
                        riskResult
                    });

                    alertsGenerated++;
                }

                tradesSaved++;
            }
            catch (error) {
                failedRows.push({
                    rowNumber: i + 1,
                    reason: error.message,
                    row: rows[i]
                });
            }
        }

        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(201).json({
            message: "CSV processed successfully",
            data: {
                totalRows: rows.length,
                tradesSaved,
                alertsGenerated,
                failedRowsCount: failedRows.length,
                failedRows
            }
        });
    }
    catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            message: "Failed to process CSV",
            error: error.message
        });
    }
};

const getTradeById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid trade id"
            });
        }

        const trade = await Trade.findById(id);

        if (!trade) {
            return res.status(404).json({
                message: "Trade not found"
            });
        }

        res.status(200).json({
            message: "Fetched trade successfully",
            data: trade
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch trade",
            error: error.message
        });
    }
};

const updateTrade = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid trade id"
            });
        }

        const trade = await Trade.findById(id);

        if (!trade) {
            return res.status(404).json({
                message: "Trade not found"
            });
        }

        const allowedFields = [
            "traderId",
            "traderName",
            "stockSymbol",
            "tradeType",
            "quantity",
            "price",
            "tradeTime"
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                if (field === "stockSymbol") {
                    trade[field] = req.body[field].toUpperCase().trim();
                }
                else if (field === "tradeType") {
                    trade[field] = req.body[field].toUpperCase().trim();
                }
                else if (field === "quantity" || field === "price") {
                    trade[field] = Number(req.body[field]);
                }
                else {
                    trade[field] = req.body[field];
                }
            }
        });

        if (!["BUY", "SELL"].includes(trade.tradeType)) {
            return res.status(400).json({
                message: "tradeType must be BUY or SELL"
            });
        }

        if (Number.isNaN(trade.quantity) || trade.quantity <= 0) {
            return res.status(400).json({
                message: "quantity must be a positive number"
            });
        }

        if (Number.isNaN(trade.price) || trade.price <= 0) {
            return res.status(400).json({
                message: "price must be a positive number"
            });
        }

        await trade.save();

        res.status(200).json({
            message: "Trade updated successfully",
            data: trade
        });
    }
    catch (error) {
        res.status(400).json({
            message: "Failed to update trade",
            error: error.message
        });
    }
};

const deleteTrade = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid trade id"
            });
        }

        const trade = await Trade.findByIdAndDelete(id);

        if (!trade) {
            return res.status(404).json({
                message: "Trade not found"
            });
        }

        res.status(200).json({
            message: "Trade deleted successfully",
            data: trade
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to delete trade",
            error: error.message
        });
    }
};

module.exports = {
    getTrades,
    createTrade,
    getTradeById,
    updateTrade,
    deleteTrade,
    uploadTradesCSV
};