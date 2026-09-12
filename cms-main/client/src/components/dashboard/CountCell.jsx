const CountCell = ({ value }) => {
  return (
    <div className="flex justify-center">
      <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-xs font-semibold">
        {value}
      </span>
    </div>
  );
};

export default CountCell;