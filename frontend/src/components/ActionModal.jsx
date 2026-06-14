import { useCallback, useEffect, useState } from "react";

const ActionModal = ({
    isOpen,
    title,
    message,
    confirmText = "OK",
    cancelText = "Cancel",
    showCancel = false,
    onConfirm,
    onClose,
    variant = "info",
    loading = false
}) => {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = useCallback(() => {
        if (loading) {
            return;
        }

        setIsClosing(true);

        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 180);
    }, [loading, onClose]);

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape" && isOpen && !loading) {
                handleClose();
            }
        };

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [handleClose, isOpen, loading]);

    if (!isOpen) {
        return null;
    }

    const handleOverlayClick = (event) => {
        if (event.target === event.currentTarget) {
            handleClose();
        }
    };

    const iconMap = {
        info: "i",
        warning: "?",
        danger: "!",
        success: "✓",
        promote: "↑",
        demote: "↓"
    };

    const gradientMap = {
        info: "from-blue-500 to-indigo-600",
        warning: "from-amber-500 to-orange-500",
        danger: "from-red-500 to-rose-600",
        success: "from-emerald-500 to-green-600",
        promote: "from-blue-500 to-indigo-600",
        demote: "from-amber-500 to-orange-500"
    };

    const buttonMap = {
        info: "bg-indigo-600 hover:bg-indigo-700",
        warning: "bg-amber-500 hover:bg-amber-600",
        danger: "bg-red-600 hover:bg-red-700",
        success: "bg-emerald-600 hover:bg-emerald-700",
        promote: "bg-indigo-600 hover:bg-indigo-700",
        demote: "bg-amber-500 hover:bg-amber-600"
    };

    return (
        <div
            onClick={handleOverlayClick}
            className={`fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm ${isClosing ? "modal-overlay-exit" : "modal-overlay-enter"
                }`}
        >
            <div
                className={`w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 ${isClosing ? "modal-card-exit" : "modal-card-enter"
                    }`}
            >
                <div className="flex items-start gap-4">
                    <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradientMap[variant] || gradientMap.info
                            } text-xl font-black text-white shadow-lg`}
                    >
                        {iconMap[variant] || iconMap.info}
                    </div>

                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    {showCancel && (
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            {cancelText}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${buttonMap[variant] || buttonMap.info
                            }`}
                    >
                        {loading ? "Please wait..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActionModal;
