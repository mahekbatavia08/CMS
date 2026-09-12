const ProjectOverviewToolbar = ({
    filters,
    onChange,
    onReset,
}) => {
    return (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Search
                    </label>

                    <input
                        type="text"
                        placeholder="Project or Builder..."
                        value={filters.search}
                        onChange={(e) =>
                            onChange("search", e.target.value)
                        }
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-500/30 transition-colors"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Status
                    </label>

                    <select
                        value={filters.status}
                        onChange={(e) =>
                            onChange("status", e.target.value)
                        }
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-500/30 transition-colors cursor-pointer"
                    >
                        <option value="" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">All</option>
                        <option value="Published" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                            Published
                        </option>
                        <option value="Draft" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                            Draft
                        </option>
                        <option value="Archived" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                            Archived
                        </option>
                    </select>
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Featured
                    </label>

                    <select
                        value={filters.featured}
                        onChange={(e) =>
                            onChange("featured", e.target.value)
                        }
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-500/30 transition-colors cursor-pointer"
                    >
                        <option value="" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">All</option>
                        <option value="true" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                            Featured
                        </option>
                        <option value="false" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                            Not Featured
                        </option>
                    </select>
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Sort
                    </label>

                    <select
                        value={filters.sort}
                        onChange={(e) =>
                            onChange("sort", e.target.value)
                        }
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-500/30 transition-colors cursor-pointer"
                    >
                        <option value="newest" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                            Newest
                        </option>

                        <option value="oldest" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                            Oldest
                        </option>

                        <option value="name-asc" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                            Name A-Z
                        </option>

                        <option value="name-desc" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                            Name Z-A
                        </option>
                    </select>
                </div>

                <div className="flex items-end">
                    <button
                        onClick={onReset}
                        className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                        Reset Filters
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ProjectOverviewToolbar;