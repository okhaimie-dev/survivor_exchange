type PaginationProps = {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
};

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    return (
        <nav className="flex items-center gap-3 text-sm font-orbitron uppercase tracking-wide text-white">
            <button
                type="button"
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`rounded border px-3 py-1 transition ${
                    currentPage === 1
                        ? "cursor-not-allowed border-white/30 text-white/30"
                        : "border-white hover:cursor-pointer hover:border-[rgb(50,255,52)] hover:text-[rgb(50,255,52)]"
                }`}
            >
                Previous
            </button>
            <ul className="flex items-center gap-2">
                {pages.map((page) => (
                    <li key={page}>
                        <button
                            type="button"
                            onClick={() => onPageChange(page)}
                            className={`rounded px-2 py-1 transition ${
                                page === currentPage
                                    ? "border border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)]"
                                    : "border border-transparent hover:cursor-pointer hover:border-[rgb(50,255,52)] hover:text-[rgb(50,255,52)]"
                            }`}
                        >
                            {page}
                        </button>
                    </li>
                ))}
            </ul>
            <button
                type="button"
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={`rounded border px-3 py-1 transition ${
                    currentPage === totalPages
                        ? "cursor-not-allowed border-white/30 text-white/30"
                        : "border-white hover:cursor-pointer hover:border-[rgb(50,255,52)] hover:text-[rgb(50,255,52)]"
                }`}
            >
                Next
            </button>
        </nav>
    );
}