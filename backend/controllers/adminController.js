const User = require("../models/User");
const { createAuditLog } = require("../services/auditLogService");

const getMembers = async (req, res) => {
    try {
        const members = await User.find({})
            .select("-password -passwordResetToken -passwordResetExpires")
            .sort({ createdAt: -1 });

        const totalMembers = members.length;
        const totalAdmins = members.filter((user) => user.role === "ADMIN").length;
        const totalAnalysts = members.filter((user) => user.role === "ANALYST").length;

        res.status(200).json({
            message: "Members fetched successfully",
            data: {
                stats: {
                    totalMembers,
                    totalAdmins,
                    totalAnalysts
                },
                members
            }
        });
    }
    catch (error) {
        console.error("Get members error:", error);
        res.status(500).json({ message: "Failed to fetch members" });
    }
};

const updateMemberRole = async (req, res) => {
    try {
        const { role } = req.body;
        const memberId = req.params.id;

        if (!["ADMIN", "ANALYST"].includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const member = await User.findById(memberId);

        if (!member) {
            return res.status(404).json({ message: "Member not found" });
        }

        if (member._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                message: "You cannot change your own role"
            });
        }

        if (member.role === "ADMIN" && role === "ANALYST") {
            const adminCount = await User.countDocuments({ role: "ADMIN" });

            if (adminCount <= 1) {
                return res.status(400).json({
                    message: "Cannot demote the last remaining admin"
                });
            }
        }

        const previousRole = member.role;

        member.role = role;
        await member.save();

        if (previousRole !== role) {
            await createAuditLog({
                req,
                action: "USER_ROLE_UPDATED",
                target: {
                    entityType: "USER",
                    entityId: member._id.toString(),
                    label: `${member.name} (${member.email})`
                },
                changes: {
                    role: {
                        from: previousRole,
                        to: role
                    }
                }
            });
        }

        const updatedMember = await User.findById(memberId)
            .select("-password -passwordResetToken -passwordResetExpires");

        res.status(200).json({
            message: "Member role updated successfully",
            data: updatedMember
        });
    }
    catch (error) {
        console.error("Update member role error:", error);
        res.status(500).json({ message: "Failed to update member role" });
    }
};

const deleteMember = async (req, res) => {
    try {
        const memberId = req.params.id;

        const member = await User.findById(memberId);

        if (!member) {
            return res.status(404).json({ message: "Member not found" });
        }

        if (member._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                message: "You cannot remove your own account"
            });
        }

        if (member.role === "ADMIN") {
            const adminCount = await User.countDocuments({ role: "ADMIN" });

            if (adminCount <= 1) {
                return res.status(400).json({
                    message: "Cannot remove the last remaining admin"
                });
            }
        }

        await User.findByIdAndDelete(memberId);

        res.status(200).json({
            message: "Member removed successfully"
        });
    }
    catch (error) {
        console.error("Delete member error:", error);
        res.status(500).json({ message: "Failed to remove member" });
    }
};

module.exports = {
    getMembers,
    updateMemberRole,
    deleteMember
};
