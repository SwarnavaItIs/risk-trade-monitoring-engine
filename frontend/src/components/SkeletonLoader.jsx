const SkeletonLoader = ({ type = "cards" }) => {
    if (type === "table") {
        return (
            <div className="animate-pulse overflow-hidden rounded-2xl bg-white shadow">
                <div className="space-y-4 p-6">
                    <div className="h-6 w-1/3 rounded bg-slate-200"></div>

                    {[1, 2, 3, 4, 5].map((item) => (
                        <div
                            key={item}
                            className="grid grid-cols-6 gap-4 border-b border-slate-100 pb-4"
                        >
                            <div className="h-4 rounded bg-slate-200"></div>
                            <div className="h-4 rounded bg-slate-200"></div>
                            <div className="h-4 rounded bg-slate-200"></div>
                            <div className="h-4 rounded bg-slate-200"></div>
                            <div className="h-4 rounded bg-slate-200"></div>
                            <div className="h-4 rounded bg-slate-200"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (type === "details") {
        return (
            <div className="animate-pulse grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 shadow">
                    <div className="mb-5 h-6 w-1/2 rounded bg-slate-200"></div>
                    <div className="space-y-3">
                        <div className="h-4 rounded bg-slate-200"></div>
                        <div className="h-4 w-5/6 rounded bg-slate-200"></div>
                        <div className="h-4 w-2/3 rounded bg-slate-200"></div>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow">
                    <div className="mb-5 h-6 w-1/2 rounded bg-slate-200"></div>
                    <div className="space-y-3">
                        <div className="h-4 rounded bg-slate-200"></div>
                        <div className="h-4 w-5/6 rounded bg-slate-200"></div>
                        <div className="h-4 w-2/3 rounded bg-slate-200"></div>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow lg:col-span-2">
                    <div className="mb-5 h-6 w-1/3 rounded bg-slate-200"></div>
                    <div className="space-y-3">
                        <div className="h-4 rounded bg-slate-200"></div>
                        <div className="h-4 w-5/6 rounded bg-slate-200"></div>
                        <div className="h-4 w-2/3 rounded bg-slate-200"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-pulse">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="rounded-2xl bg-white p-6 shadow">
                        <div className="h-4 w-1/2 rounded bg-slate-200"></div>
                        <div className="mt-4 h-8 w-1/3 rounded bg-slate-200"></div>
                    </div>
                ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
                {[1, 2].map((item) => (
                    <div key={item} className="rounded-2xl bg-white p-6 shadow">
                        <div className="mb-5 h-6 w-1/2 rounded bg-slate-200"></div>
                        <div className="space-y-3">
                            <div className="h-4 rounded bg-slate-200"></div>
                            <div className="h-4 w-5/6 rounded bg-slate-200"></div>
                            <div className="h-4 w-2/3 rounded bg-slate-200"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SkeletonLoader;