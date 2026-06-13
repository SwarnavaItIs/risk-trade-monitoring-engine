const test = require("node:test");
const assert = require("node:assert/strict");

const AuditLog = require("../models/AuditLog");
const {
    buildChanges,
    createAuditLog
} = require("../services/auditLogService");

test("buildChanges stores before and after values for changed fields", () => {
    const changes = buildChanges(
        {
            enabled: true,
            severity: "LOW",
            parameters: { threshold: 100 }
        },
        {
            enabled: false,
            severity: "LOW",
            parameters: { threshold: 200 }
        },
        ["enabled", "severity", "parameters"]
    );

    assert.deepEqual(changes, {
        enabled: {
            from: true,
            to: false
        },
        parameters: {
            from: { threshold: 100 },
            to: { threshold: 200 }
        }
    });
});

test("buildChanges treats matching values as unchanged", () => {
    const changes = buildChanges(
        { status: "PENDING" },
        { status: "PENDING" },
        ["status"]
    );

    assert.deepEqual(changes, {});
});

test("createAuditLog captures actor, target, and request context", async (context) => {
    const originalCreate = AuditLog.create;
    let createdLog;

    context.after(() => {
        AuditLog.create = originalCreate;
    });

    AuditLog.create = async (log) => {
        createdLog = log;
        return log;
    };

    await createAuditLog({
        req: {
            user: {
                _id: "507f1f77bcf86cd799439011",
                name: "Admin User",
                email: "admin@example.com",
                role: "ADMIN"
            },
            headers: {
                "x-forwarded-for": "203.0.113.10, 10.0.0.1"
            },
            get: () => "Audit Test Agent"
        },
        action: "RISK_RULE_UPDATED",
        target: {
            entityType: "RISK_RULE",
            entityId: "rule-1",
            label: "R1 - Order Limit"
        },
        changes: {
            enabled: {
                from: true,
                to: false
            }
        }
    });

    assert.deepEqual(createdLog.actor, {
        userId: "507f1f77bcf86cd799439011",
        name: "Admin User",
        email: "admin@example.com",
        role: "ADMIN"
    });
    assert.equal(createdLog.request.ipAddress, "203.0.113.10");
    assert.equal(createdLog.request.userAgent, "Audit Test Agent");
    assert.equal(createdLog.target.entityId, "rule-1");
});
