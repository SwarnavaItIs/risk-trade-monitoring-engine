const test = require("node:test");
const assert = require("node:assert/strict");

const Alert = require("../models/Alert");
const AuditLog = require("../models/AuditLog");

const buildAlert = (overrides = {}) => {
    return new Alert({
        tradeId: "507f1f77bcf86cd799439011",
        traderId: "T-100",
        traderName: "Test Trader",
        stockSymbol: "TCS",
        alertType: "TEST_ALERT",
        severity: "HIGH",
        message: "Test alert",
        ...overrides
    });
};

test("alert priority defaults to severity", () => {
    const alert = buildAlert();

    assert.equal(alert.priority, "HIGH");
});

test("alert comment history stores workflow actor details", async () => {
    const alert = buildAlert({
        commentHistory: [
            {
                comment: "Investigating the trading pattern",
                commentedBy: "Analyst User",
                commentedByEmail: "analyst@example.com",
                commentedByRole: "ANALYST"
            }
        ]
    });

    await alert.validate();

    assert.equal(alert.commentHistory.length, 1);
    assert.equal(alert.commentHistory[0].commentedByRole, "ANALYST");
    assert.ok(alert.commentHistory[0].createdAt instanceof Date);
});

test("audit log accepts alert workflow actions", async () => {
    const baseLog = {
        actor: {
            userId: "507f1f77bcf86cd799439011",
            name: "Admin User",
            email: "admin@example.com",
            role: "ADMIN"
        },
        target: {
            entityType: "ALERT",
            entityId: "507f1f77bcf86cd799439012"
        }
    };

    for (const action of [
        "ALERT_ASSIGNED",
        "ALERT_COMMENT_ADDED",
        "ALERT_PRIORITY_UPDATED"
    ]) {
        const auditLog = new AuditLog({
            ...baseLog,
            action
        });

        await auditLog.validate();
    }
});
