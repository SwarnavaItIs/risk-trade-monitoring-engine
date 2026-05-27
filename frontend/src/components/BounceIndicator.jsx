import { useEffect, useState } from "react";

const BounceIndicator = () => {
    const [showButton, setShowButton] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 250) {
                setShowButton(true);
            } else {
                setShowButton(false);
            }
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const handleScrollTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    if (!showButton) {
        return null;
    }

    return (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2">
            <button
                type="button"
                onClick={handleScrollTop}
                className="flex size-12 animate-bounce items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-violet-500 shadow-xl transition hover:border-violet-500 hover:bg-slate-900"
                aria-label="Scroll to top"
            >
                <svg
                    className="size-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 19V5m0 0l-6 6m6-6l6 6"
                    />
                </svg>
            </button>
        </div>
    );
};

export default BounceIndicator;