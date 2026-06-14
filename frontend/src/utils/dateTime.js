export const formatForDateTimeLocal = (dateValue) => {
    if (!dateValue) {
        return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);

    return localDate.toISOString().slice(0, 16);
};

export const dateTimeLocalToIso = (dateValue, emptyValue = undefined) => {
    if (!dateValue) {
        return emptyValue;
    }

    const date = new Date(dateValue);

    return Number.isNaN(date.getTime())
        ? emptyValue
        : date.toISOString();
};
