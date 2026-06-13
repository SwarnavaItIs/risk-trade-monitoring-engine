const AuditLog = require("../models/AuditLog");

const normalizeValue = (value) => {
    if (value === undefined) {
        return null;
    }

    if (value && typeof value.toObject === "function") {
        return value.toObject();
    }

    return value;
};

const valuesMatch = (left, right) => {
    return JSON.stringify(normalizeValue(left)) === JSON.stringify(normalizeValue(right));
};

const buildChanges = (before, after, fields) => {
    return fields.reduce((changes, field) => {
        const previousValue = normalizeValue(before?.[field]);
        const currentValue = normalizeValue(after?.[field]);

        if (!valuesMatch(previousValue, currentValue)) {
            changes[field] = {
                from: previousValue,
                to: currentValue
            };
        }

        return changes;
    }, {});
};

const getIpAddress = (req) => {
    const forwardedFor = req.headers?.["x-forwarded-for"];

    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }

    return req.ip || req.socket?.remoteAddress || "";
};

const createAuditLog = async ({
    req,
    action,
    target,
    changes = {},
    metadata = {}
}) => {
    if (!req.user) {
        throw new Error("Authenticated user is required to create an audit log");
    }

    return AuditLog.create({
        actor: {
            userId: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        },
        action,
        target,
        changes,
        metadata,
        request: {
            ipAddress: getIpAddress(req),
            userAgent: req.get?.("user-agent") || ""
        }
    });
};

module.exports = {
    buildChanges,
    createAuditLog
};
