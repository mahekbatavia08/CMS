const CompletionCell = ({ value }) => {
  const getColor = () => {
    if (value >= 90) return "text-green-500";
    if (value >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex items-center justify-center gap-2">
      <div className="relative inline-flex items-center justify-center">
        <svg className="w-10 h-10 transform -rotate-90">
          <circle
            className="text-slate-200 dark:text-slate-700"
            strokeWidth="4"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="20"
            cy="20"
          />
          <circle
            className={`${getColor()} transition-all duration-1000 ease-in-out`}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="20"
            cy="20"
          />
        </svg>
        <span className="absolute text-[10px] font-semibold text-slate-700 dark:text-slate-200">
          {value}%
        </span>
      </div>
    </div>
  );
};

export default CompletionCell;