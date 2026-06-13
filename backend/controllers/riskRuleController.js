const RiskRule = require("../models/RiskRules");
const {
    buildChanges,
    createAuditLog
} = require("../services/auditLogService");

const getRiskRules = async (req, res) => {
    try {
        const { tier, enabled, action } = req.query;

        const query = {};

        if (tier) {
            query.tier = tier;
        }

        if (enabled !== undefined) {
            query.enabled = enabled === "true";
        }

        if (action) {
            query.action = action;
        }

        const rules = await RiskRule.find(query).sort({
            tier: 1,
            ruleCode: 1
        });

        res.status(200).json({
            message: "Risk rules fetched successfully",
            count: rules.length,
            data: rules
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch risk rules",
            error: error.message
        });
    }
};

const getRiskRuleById = async (req, res) => {
    try {
        const rule = await RiskRule.findById(req.params.id);

        if (!rule) {
            return res.status(404).json({
                message: "Risk rule not found"
            });
        }

        res.status(200).json({
            message: "Risk rule fetched successfully",
            data: rule
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch risk rule",
            error: error.message
        });
    }
};

const updateRiskRule = async (req, res) => {
    try {
        const allowedUpdates = [
            "ruleName",
            "description",
            "enabled",
            "severity",
            "riskWeight",
            "action",
            "parameters"
        ];

        const updateData = {};

        allowedUpdates.forEach((field) => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        const existingRule = await RiskRule.findById(req.params.id);

        if (!existingRule) {
            return res.status(404).json({
                message: "Risk rule not found"
            });
        }

        const rule = await RiskRule.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        const changes = buildChanges(existingRule, rule, allowedUpdates);

        if (Object.keys(changes).length > 0) {
            await createAuditLog({
                req,
                action: "RISK_RULE_UPDATED",
                target: {
                    entityType: "RISK_RULE",
                    entityId: rule._id.toString(),
                    label: `${rule.ruleCode} - ${rule.ruleName}`
                },
                changes
            });
        }

        res.status(200).json({
            message: "Risk rule updated successfully",
            data: rule
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to update risk rule",
            error: error.message
        });
    }
};

module.exports = {
    getRiskRules,
    getRiskRuleById,
    updateRiskRule
};
