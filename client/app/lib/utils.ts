export const clsx = (...classes: string[]) => {
    return classes.filter(Boolean).join(" ");
}

export const truncateWithEllipsis = (str: string, maxLength: number = 20): string => {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength) + '...';
};

export const formatPrice = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined) return "—";
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue) || numValue === 0) return "0.00";
    
    const absValue = Math.abs(numValue);
    const sign = numValue < 0 ? "-" : "";
    
    if (absValue >= 1000000000) {
        return `${sign}${(absValue / 1000000000).toFixed(2)}B`;
    } else if (absValue >= 1000000) {
        return `${sign}${(absValue / 1000000).toFixed(2)}m`;
    } else if (absValue >= 1000) {
        return `${sign}${(absValue / 1000).toFixed(2)}k`;
    } else {
        return `${sign}${absValue.toFixed(2)}`;
    }
};