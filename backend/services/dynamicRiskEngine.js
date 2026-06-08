const RiskRule = require("../models/RiskRules");

const getEnabledRiskRules = async () => {
    return RiskRule.find({ enabled: true }).sort({
        tier: 1,
        ruleCode: 1
    });
};

const getRulesByTier = async (tier) => {
    return RiskRule.find({
        enabled: true,
        tier
    }).sort({
        ruleCode: 1
    });
};

const buildRuleMap = (rules) => {
    const ruleMap = {};

    rules.forEach((rule) => {
        ruleMap[rule.ruleCode] = rule;
    });

    return ruleMap;
};

module.exports = {
    getEnabledRiskRules,
    getRulesByTier,
    buildRuleMap
};