const {
    callAIModel,
    getAIServiceStatus
} = require("../services/aiService");

const Alert = require("../models/Alert");
const Trade = require("../models/Trade");

const {
    getComplianceSystemPrompt,
    buildTestPrompt,
    buildAlertExplanationPrompt,
    buildInvestigationSummaryPrompt,
    buildLocalAlertExplanation,
    buildLocalInvestigationSummary,
    buildDailyRiskReportPrompt,
    buildRiskAssistantPrompt,
    buildRuleTuningSuggestionPrompt
} = require("../services/aiPromptBuilders");

const { collectDailyRiskReportData, collectRiskAssistantData,collectRuleTuningData } = require("../services/aiDataService");

const buildFallbackResponse = ({ message, field, content, providerMessage }) => {
    return {
        message,
        data: {
            [field]: content,
            source: "LOCAL_FALLBACK",
            aiAvailable: false,
            providerMessage
        }
    };
};

const loadAlertContext = async (alertId) => {
    const alert = await Alert.findById(alertId)
        .populate("assignedTo", "name email role status");

    if (!alert) {
        return {
            alert: null,
            trade: null
        };
    }

    let trade = null;

    if (alert.tradeId) {
        trade = await Trade.findById(alert.tradeId);
    }

    return {
        alert,
        trade
    };
};

const getAIHealth = async (req, res) => {
    try {
        res.status(200).json({
            message: "AI service health fetched successfully",
            data: getAIServiceStatus()
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch AI service health",
            error: error.message
        });
    }
};

const testAIService = async (req, res) => {
    try {
        const result = await callAIModel({
            systemPrompt: getComplianceSystemPrompt(),
            userPrompt: buildTestPrompt(),
            temperature: 0.2
        });

        if (!result.success) {
            return res.status(503).json({
                message: "AI provider is unavailable",
                data: {
                    output: result.content,
                    source: "PROVIDER_ERROR",
                    aiAvailable: false
                }
            });
        }

        res.status(200).json({
            message: "AI test completed successfully",
            data: {
                output: result.content,
                source: getAIServiceStatus().provider,
                aiAvailable: true
            }
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to test AI service",
            error: error.message
        });
    }
};

const explainAlert = async (req, res) => {
    try {
        const { alert, trade } = await loadAlertContext(req.params.alertId);

        if (!alert) {
            return res.status(404).json({
                message: "Alert not found"
            });
        }

        const result = await callAIModel({
            systemPrompt: getComplianceSystemPrompt(),
            userPrompt: buildAlertExplanationPrompt({
                alert,
                trade
            }),
            temperature: 0.2
        });

        if (!result.success) {
            const explanation = buildLocalAlertExplanation({
                alert,
                trade,
                providerMessage: result.content
            });

            return res.status(200).json(buildFallbackResponse({
                message: "AI provider unavailable; local fallback explanation generated",
                field: "explanation",
                content: explanation,
                providerMessage: result.content
            }));
        }

        res.status(200).json({
            message: "AI alert explanation generated successfully",
            data: {
                explanation: result.content,
                source: getAIServiceStatus().provider,
                aiAvailable: true
            }
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to explain alert",
            error: error.message
        });
    }
};

const generateInvestigationSummary = async (req, res) => {
    try {
        const { alert, trade } = await loadAlertContext(req.params.alertId);

        if (!alert) {
            return res.status(404).json({
                message: "Alert not found"
            });
        }

        const result = await callAIModel({
            systemPrompt: getComplianceSystemPrompt(),
            userPrompt: buildInvestigationSummaryPrompt({
                alert,
                trade
            }),
            temperature: 0.2
        });

        if (!result.success) {
            const summary = buildLocalInvestigationSummary({
                alert,
                trade,
                providerMessage: result.content
            });

            return res.status(200).json(buildFallbackResponse({
                message: "AI provider unavailable; local fallback investigation summary generated",
                field: "summary",
                content: summary,
                providerMessage: result.content
            }));
        }

        res.status(200).json({
            message: "AI investigation summary generated successfully",
            data: {
                summary: result.content,
                source: getAIServiceStatus().provider,
                aiAvailable: true
            }
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to generate investigation summary",
            error: error.message
        });
    }
};

const generateDailyRiskReport = async (req, res) => {
    try {
        const reportDate = req.body?.date || new Date().toISOString().slice(0, 10);

        const reportData = await collectDailyRiskReportData(reportDate);

        const result = await callAIModel({
            systemPrompt: getComplianceSystemPrompt(),
            userPrompt: buildDailyRiskReportPrompt({
                reportDate,
                reportData
            }),
            temperature: 0.2
        });

        if (!result.success) {
            return res.status(500).json({
                message: "Failed to generate AI daily risk report",
                data: {
                    report: result.content
                }
            });
        }

        res.status(200).json({
            message: "AI daily risk report generated successfully",
            data: {
                reportDate,
                report: result.content,
                sourceData: reportData
            }
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to generate daily risk report",
            error: error.message
        });
    }
};

const askRiskAssistant = async (req, res) => {
    try {
        const { question } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({
                message: "Question is required"
            });
        }

        const { intent, data } = await collectRiskAssistantData(question);

        const result = await callAIModel({
            systemPrompt: getComplianceSystemPrompt(),
            userPrompt: buildRiskAssistantPrompt({
                question,
                intent,
                data
            }),
            temperature: 0.2
        });

        if (!result.success) {
            return res.status(500).json({
                message: "Failed to generate risk assistant response",
                data: {
                    answer: result.content
                }
            });
        }

        res.status(200).json({
            message: "Risk assistant response generated successfully",
            data: {
                question,
                intent,
                answer: result.content,
                sourceData: data
            }
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to process risk assistant query",
            error: error.message
        });
    }
};

const generateRuleTuningSuggestions = async (req, res) => {
    try {
        const data = await collectRuleTuningData();

        const result = await callAIModel({
            systemPrompt: getComplianceSystemPrompt(),
            userPrompt: buildRuleTuningSuggestionPrompt({ data }),
            temperature: 0.2
        });

        if (!result.success) {
            return res.status(500).json({
                message: "Failed to generate AI rule tuning suggestions",
                data: {
                    suggestions: result.content
                }
            });
        }

        res.status(200).json({
            message: "AI rule tuning suggestions generated successfully",
            data: {
                suggestions: result.content,
                sourceData: data
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to generate rule tuning suggestions",
            error: error.message
        });
    }
};

module.exports = {
    getAIHealth,
    testAIService,
    explainAlert,
    generateInvestigationSummary,
    generateDailyRiskReport,
    askRiskAssistant,
    generateRuleTuningSuggestions
};
