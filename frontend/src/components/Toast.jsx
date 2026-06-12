import { useEffect } from "react";

const Toast = ({
    isOpen,
    title,
    message,
    variant = "success",
    onClose,
    duration = 2600
}) => {
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => {
            clearTimeout(timer);
        };
    }, [isOpen, duration, onClose]);

    if (!isOpen) {
        return null;
    }

    const variantStyles = {
        success: {
            icon: "✓",
            iconClass: "bg-emerald-500",
            borderClass: "border-emerald-200 dark:border-emerald-500/30"
        },
        danger: {
            icon: "!",
            iconClass: "bg-red-500",
            borderClass: "border-red-200 dark:border-red-500/30"
        },
        info: {
            icon: "i",
            iconClass: "bg-blue-500",
            borderClass: "border-blue-200 dark:border-blue-500/30"
        }
    };

    const current = variantStyles[variant] || variantStyles.success;

    return (
        <div className="fixed right-6 top-28 z-[99999] toast-enter">
            <div
                className={`flex w-[360px] items-start gap-3 rounded-2xl border bg-white p-4 shadow-2xl dark:bg-slate-900 ${current.borderClass}`}
            >
                <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${current.iconClass}`}
                >
                    {current.icon}
                </div>

                <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {title}
                    </h4>

                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {message}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="text-slate-400 transition hover:text-slate-700 dark:hover:text-white"
                >
                    ×
                </button>
            </div>
        </div>
    );
};

export default Toast;