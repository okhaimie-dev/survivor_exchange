export const clsx = (...classes: string[]) => {
    return classes.filter(Boolean).join(" ");
}