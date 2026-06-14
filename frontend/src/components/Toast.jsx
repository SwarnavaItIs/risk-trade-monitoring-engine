import { useEffect } from "react";

const Toast = ({
    isOpen,
    title,
    message,
    variant = "success",
    onClose,
    duration = 3200
}) => {
    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const timer = setTimeout(onClose, duration);

        return () => clearTimeout(timer);
    }, [isOpen, duration, onClose]);

    if (!isOpen) {
        return null;
    }

    const variantStyles = {
        success: {
            icon: "OK",
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
        <div className="toast-enter w-[min(360px,calc(100vw-2rem))]" role="status">
            <div
                className={`flex w-full items-start gap-3 rounded-2xl border bg-white p-4 shadow-2xl dark:bg-slate-900 ${current.borderClass}`}
            >
                <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${current.iconClass}`}
                >
                    {current.icon}
                </div>

                <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {title}
                    </h4>

                    <p className="mt-1 break-words text-sm text-slate-600 dark:text-slate-300">
                        {message}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close notification"
                    className="text-slate-400 transition hover:text-slate-700 dark:hover:text-white"
                >
                    x
                </button>
            </div>
        </div>
    );
};

export default Toast;
