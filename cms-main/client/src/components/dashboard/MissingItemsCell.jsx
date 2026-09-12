const MissingItemsCell = ({ items = [] }) => {
    if (items.length === 0) {
        return (
            <span className="rounded-full bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300 dark:border dark:border-green-800/60 px-2.5 py-0.5 text-xs font-medium">
                Complete
            </span>
        );
    }

    return (
        <div className="flex flex-wrap gap-1">
            {items.map((item) => (
                <span
                    key={item}
                    className="rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 dark:border dark:border-red-800/60 px-2 py-0.5 text-xs font-medium"
                >
                    {item}
                </span>
            ))}
        </div>
    );
};

export default MissingItemsCell;