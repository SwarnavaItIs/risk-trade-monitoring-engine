const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const RiskRule = require("../models/RiskRules");
const {
    defaultRiskRules,
    seedRiskRules
} = require("../seed/riskRulesSeeder");

test("risk rules seeder contains one descriptive default for R1 through R12", () => {
    const ruleCodes = defaultRiskRules.map((rule) => rule.ruleCode);

    assert.equal(defaultRiskRules.length, 12);
    assert.equal(new Set(ruleCodes).size, 12);
    assert.deepEqual(
        ruleCodes.map((ruleCode) => ruleCode.match(/^R(\d+)_/)?.[1]),
        Array.from({ length: 12 }, (_, index) => String(index + 1))
    );

    defaultRiskRules.forEach((rule) => {
        assert.ok(rule.description.length > 140);
    });
});

test("risk rules seeder updates by ruleCode using upsert", async (context) => {
    const originalConnect = mongoose.connect;
    const originalFindOneAndUpdate = RiskRule.findOneAndUpdate;
    const originalLog = console.log;
    const operations = [];

    context.after(() => {
        mongoose.connect = originalConnect;
        RiskRule.findOneAndUpdate = originalFindOneAndUpdate;
        console.log = originalLog;
    });

    mongoose.connect = async () => {};
    RiskRule.findOneAndUpdate = async (filter, update, options) => {
        operations.push({ filter, update, options });
        return update;
    };
    console.log = () => {};

    await seedRiskRules();

    assert.equal(operations.length, 12);
    assert.equal(
        new Set(operations.map((operation) => operation.filter.ruleCode)).size,
        12
    );

    operations.forEach((operation) => {
        assert.deepEqual(operation.filter, {
            ruleCode: operation.update.ruleCode
        });
        assert.equal(operation.options.upsert, true);
        assert.equal(operation.options.new, true);
        assert.equal(operation.options.setDefaultsOnInsert, true);
    });
});
