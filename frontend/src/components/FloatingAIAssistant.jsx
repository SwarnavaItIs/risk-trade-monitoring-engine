import { useLocation, useNavigate } from "react-router-dom";

const hiddenRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password"
];

const FloatingAIAssistant = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const shouldHide = hiddenRoutes.some((route) =>
        location.pathname.startsWith(route)
    );

    if (shouldHide) return null;

    return (
        <div className="group fixed bottom-10 right-9 z-50">
            <div className="pointer-events-none absolute bottom-1/2 right-14 hidden translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-lg group-hover:block dark:bg-white dark:text-slate-900">
                AI Risk Assistant
            </div>

            <button
                type="button"
                onClick={() => navigate("/risk-assistant")}
                aria-label="Open AI Risk Assistant"
                title="AI Risk Assistant"
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:shadow-indigo-950/50"
            >
                AI
            </button>
        </div>
    );
};

export default FloatingAIAssistant;