import { useCallback, useMemo, useState } from "react";

import Toast from "./Toast";
import ToastContext from "../context/ToastContext";

let nextToastId = 0;

const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((currentToasts) => (
            currentToasts.filter((toast) => toast.id !== id)
        ));
    }, []);

    const showToast = useCallback((message, options = {}) => {
        const toast = {
            id: ++nextToastId,
            title: options.title || "Notification",
            message,
            variant: options.variant || "success",
            duration: options.duration || 3200
        };

        setToasts((currentToasts) => [...currentToasts, toast].slice(-4));

        return toast.id;
    }, []);

    const value = useMemo(() => ({ showToast, removeToast }), [
        removeToast,
        showToast
    ]);

    return (
        <ToastContext.Provider value={value}>
            {children}

            <div
                className="fixed right-4 top-24 z-[99999] flex flex-col gap-3"
                aria-live="polite"
                aria-atomic="false"
            >
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        isOpen
                        title={toast.title}
                        message={toast.message}
                        variant={toast.variant}
                        duration={toast.duration}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
