const DateTimeInput = ({
    label,
    name,
    value,
    onChange,
    required = false,
    helperText,
    min,
    max
}) => {
    const handlePickerClick = (event) => {
        if (typeof event.currentTarget.showPicker === "function") {
            event.currentTarget.showPicker();
        }
    };

    return (
        <div>
            {label && (
                <label
                    htmlFor={name}
                    className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                    {label}
                </label>
            )}

            <input
                id={name}
                type="datetime-local"
                name={name}
                value={value}
                onChange={onChange}
                onClick={handlePickerClick}
                required={required}
                min={min}
                max={max}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />

            {helperText && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {helperText}
                </p>
            )}
        </div>
    );
};

export default DateTimeInput;
