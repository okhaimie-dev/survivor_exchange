export const clsx = (...classes: string[]) => {
    return classes.filter(Boolean).join(" ");
}

export const truncateWithEllipsis = (str: string, maxLength: number = 20): string => {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength) + '...';
};