import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer
} from "recharts";

const severityColors = {
    LOW: "#60a5fa",
    MEDIUM: "#3b82f6",
    HIGH: "#1d4ed8",
    CRITICAL: "#dbeafe"
};

const SeverityPieTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    const data = payload[0].payload;

    return (
        <div className="severity-pie-tooltip rounded-xl border border-slate-200 bg-white/90 px-4 py-3 shadow-xl backdrop-blur-xl dark:border-white/30 dark:bg-white/40">
            <p className="text-sm font-bold text-slate-900">
                {data.severity}
            </p>

            <p className="mt-1 text-xs text-slate-700">
                Count:{" "}
                <span className="font-bold text-slate-900">
                    {data.count}
                </span>
            </p>
        </div>
    );
};

const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (!percent || percent === 0) {
        return null;
    }

    const radius = innerRadius + (outerRadius - innerRadius) * 0.58;
    const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
    const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

    return (
        <text
            x={x}
            y={y}
            fill="#ffffff"
            textAnchor="middle"
            dominantBaseline="central"
            className="text-xs font-bold"
        >
            {(percent * 100).toFixed(1)}%
        </text>
    );
};

const AlertsSeverityChart = ({ severityData }) => {
    return (
        <div className="rounded-2xl bg-white p-6 shadow dark:border dark:border-slate-800 dark:bg-slate-900 dark:shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                Alerts by Severity
            </h3>

            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                Distribution of alerts grouped by risk severity.
            </p>

            <div className="h-72">
                {severityData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                        No severity data found.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={severityData}
                                dataKey="count"
                                nameKey="severity"
                                cx="50%"
                                cy="50%"
                                outerRadius={105}
                                paddingAngle={1}
                                label={renderPieLabel}
                                labelLine={false}
                                stroke="#ffffff"
                                strokeWidth={2}
                                isAnimationActive={true}
                                animationDuration={700}
                                animationEasing="ease-out"
                            >
                                {severityData.map((entry) => (
                                    <Cell
                                        key={entry.severity}
                                        fill={severityColors[entry.severity] || "#93c5fd"}
                                    />
                                ))}
                            </Pie>

                            <Tooltip
                                content={<SeverityPieTooltip />}
                                cursor={false}
                                isAnimationActive={true}
                                animationDuration={220}
                                animationEasing="ease-out"
                                wrapperStyle={{
                                    outline: "none",
                                    pointerEvents: "none",
                                    transition: "opacity 220ms ease-out, transform 220ms ease-out"
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-5">
                {severityData.map((item) => (
                    <div
                        key={item.severity}
                        className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                        <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                                backgroundColor: severityColors[item.severity] || "#93c5fd"
                            }}
                        ></span>

                        <span>{item.severity}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default AlertsSeverityChart;