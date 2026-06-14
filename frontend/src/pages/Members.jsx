import { useEffect, useMemo, useState } from "react";
import {
    getAdminMembers,
    updateAdminMemberRole,
    deleteAdminMember,
    getMe
} from "../api/api";

import LoadingButton from "../components/LoadingButton";
import Navbar from "../components/Navbar";
import ActionModal from "../components/ActionModal";
import useToast from "../hooks/useToast";

const Members = () => {
    const { showToast } = useToast();
    const [members, setMembers] = useState([]);
    const [stats, setStats] = useState({
        totalMembers: 0,
        totalAdmins: 0,
        totalAnalysts: 0
    });

    const [currentUser, setCurrentUser] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState("");

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        confirmText: "OK",
        cancelText: "Cancel",
        showCancel: false,
        variant: "info",
        onConfirm: null
    });

    const fetchMembers = async () => {
        try {
            setLoading(true);

            const [membersResponse, meResponse] = await Promise.all([
                getAdminMembers(),
                getMe()
            ]);

            setMembers(membersResponse.data.data.members || []);
            setStats(membersResponse.data.data.stats || {
                totalMembers: 0,
                totalAdmins: 0,
                totalAnalysts: 0
            });

            setCurrentUser(meResponse.data.data || meResponse.data.user || null);
            setError("");
        }
        catch (err) {
            console.log(err);
            setError(err.response?.data?.message || "Failed to load members");
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchMembers();
    }, []);

    const filteredMembers = useMemo(() => {
        return members.filter((member) => {
            const searchValue = searchText.toLowerCase();

            const matchesSearch =
                member.name?.toLowerCase().includes(searchValue) ||
                member.email?.toLowerCase().includes(searchValue);

            const matchesRole =
                roleFilter === "ALL" || member.role === roleFilter;

            return matchesSearch && matchesRole;
        });
    }, [members, searchText, roleFilter]);

    const handleRoleChange = async (member, newRole) => {
        if (member.role === newRole) {
            return;
        }

        if (isCurrentUser(member)) {
            openInfoModal(
                "Action not allowed",
                "You cannot change your own role.",
                "danger"
            );
            return;
        }

        openConfirmModal({
            title: newRole === "ADMIN" ? "Promote Member" : "Demote Member",
            message:
                newRole === "ADMIN"
                    ? `Are you sure you want to promote ${member.name} to ADMIN?`
                    : `Are you sure you want to demote ${member.name} to ANALYST?`,
            confirmText: newRole === "ADMIN" ? "Promote" : "Demote",
            variant: newRole === "ADMIN" ? "info" : "warning",
            onConfirm: async () => {
                try {
                    setActionLoading(member._id);
                    closeModal();

                    await updateAdminMemberRole(member._id, newRole);
                    await fetchMembers();

                    showToast(
                        `${member.name}'s role has been updated successfully.`,
                        { title: "Role updated" }
                    );
                }
                catch (err) {
                    console.log(err);
                    closeModal();

                    showToast(
                        err.response?.data?.message || "Failed to update member role.",
                        { title: "Role update failed", variant: "danger" }
                    );
                    openInfoModal(
                        "Action failed",
                        err.response?.data?.message || "Failed to update member role.",
                        "danger"
                    );
                }
                finally {
                    setActionLoading("");
                }
            }
        });
    };

    const handleDeleteMember = async (member) => {
        if (isCurrentUser(member)) {
            openInfoModal(
                "Action not allowed",
                "You cannot remove your own account.",
                "danger"
            );
            return;
        }

        openConfirmModal({
            title: "Remove Member",
            message: `Are you sure you want to remove ${member.name}? This action cannot be undone.`,
            confirmText: "Remove",
            variant: "danger",
            onConfirm: async () => {
                try {
                    setActionLoading(member._id);
                    closeModal();

                    await deleteAdminMember(member._id);
                    await fetchMembers();

                    showToast(
                        `${member.name} has been removed successfully.`,
                        { title: "Member removed" }
                    );
                }
                catch (err) {
                    console.log(err);
                    closeModal();

                    showToast(
                        err.response?.data?.message || "Failed to remove member.",
                        { title: "Member removal failed", variant: "danger" }
                    );
                    openInfoModal(
                        "Action failed",
                        err.response?.data?.message || "Failed to remove member.",
                        "danger"
                    );
                }
                finally {
                    setActionLoading("");
                }
            }
        });
    };

    const isCurrentUser = (member) => {
        return currentUser?._id === member._id || currentUser?.id === member._id;
    };

    const closeModal = () => {
        setModalConfig({
            isOpen: false,
            title: "",
            message: "",
            confirmText: "OK",
            cancelText: "Cancel",
            showCancel: false,
            variant: "info",
            onConfirm: null
        });
    };

    const openInfoModal = (title, message, variant = "info") => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            confirmText: "OK",
            cancelText: "Cancel",
            showCancel: false,
            variant,
            onConfirm: closeModal
        });
    };

    const openConfirmModal = ({
        title,
        message,
        confirmText = "Confirm",
        cancelText = "Cancel",
        variant = "warning",
        onConfirm
    }) => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            confirmText,
            cancelText,
            showCancel: true,
            variant,
            onConfirm
        });
    };

    const handleModalConfirm = async () => {
        const action = modalConfig.onConfirm;

        if (action) {
            await action();
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />

                <div className="min-h-screen bg-slate-100 p-8 pt-28 dark:bg-slate-950">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Members
                    </h1>

                    <div className="mt-4">
                        <LoadingButton text="Loading members..." />
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />

                <div className="min-h-screen bg-slate-100 p-8 pt-28 dark:bg-slate-950">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Members
                    </h1>

                    <p className="mt-4 font-semibold text-red-600">
                        {error}
                    </p>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <div className="min-h-screen bg-slate-100 p-8 pt-28 dark:bg-slate-950">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Members
                    </h1>

                    <p className="mt-2 text-slate-600 dark:text-slate-400">
                        Manage admins and analysts who have access to the risk monitoring engine.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <div className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Total Members
                        </p>

                        <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                            {stats.totalMembers}
                        </h2>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Admins
                        </p>

                        <h2 className="mt-3 text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {stats.totalAdmins}
                        </h2>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Analysts
                        </p>

                        <h2 className="mt-3 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                            {stats.totalAnalysts}
                        </h2>
                    </div>
                </div>

                <div className="mt-6 rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                Member Directory
                            </h3>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Search users, filter by role, and manage permissions.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <input
                                type="text"
                                value={searchText}
                                onChange={(event) => setSearchText(event.target.value)}
                                placeholder="Search name or email"
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            />

                            <select
                                value={roleFilter}
                                onChange={(event) => setRoleFilter(event.target.value)}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            >
                                <option value="ALL">All roles</option>
                                <option value="ADMIN">Admins</option>
                                <option value="ANALYST">Analysts</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-4">Member</th>
                                    <th className="px-5 py-4">Role</th>
                                    <th className="px-5 py-4">Auth Provider</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4">Joined</th>
                                    <th className="px-5 py-4 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredMembers.length === 0 ? (
                                    <tr>
                                        <td
                                            className="px-5 py-6 text-center text-slate-500 dark:text-slate-400"
                                            colSpan="6"
                                        >
                                            No members found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMembers.map((member) => (
                                        <tr
                                            key={member._id}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-blue-100 font-bold text-blue-700">
                                                        {member.profilePhoto ? (
                                                            <img
                                                                src={member.profilePhoto}
                                                                alt={member.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            member.name?.charAt(0)?.toUpperCase()
                                                        )}
                                                    </div>

                                                    <div>
                                                        <div className="font-semibold text-slate-900 dark:text-white">
                                                            {member.name}

                                                            {isCurrentUser(member) && (
                                                                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                                    You
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                                            {member.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-bold ${member.role === "ADMIN"
                                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                                                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                                        }`}
                                                >
                                                    {member.role}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                                                {member.authProvider || "LOCAL"}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-500/20 dark:text-green-300">
                                                    {member.status || "ACTIVE"}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                                                {member.createdAt
                                                    ? new Date(member.createdAt).toLocaleDateString()
                                                    : "N/A"}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    {member.role === "ANALYST" ? (
                                                        <button
                                                            onClick={() => handleRoleChange(member, "ADMIN")}
                                                            disabled={actionLoading === member._id}
                                                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            Promote
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleRoleChange(member, "ANALYST")}
                                                            disabled={
                                                                actionLoading === member._id ||
                                                                isCurrentUser(member)
                                                            }
                                                            className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            Demote
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleDeleteMember(member)}
                                                        disabled={
                                                            actionLoading === member._id ||
                                                            isCurrentUser(member)
                                                        }
                                                        className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ActionModal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmText={modalConfig.confirmText}
                cancelText={modalConfig.cancelText}
                showCancel={modalConfig.showCancel}
                variant={modalConfig.variant}
                onConfirm={handleModalConfirm}
                onClose={closeModal}
                loading={!!actionLoading}
            />

        </>
    );
};

export default Members;
