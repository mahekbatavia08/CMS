import { useRouteError, useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

const RouteErrorBoundary = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center space-y-4 rounded-xl border border-red-100 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10 p-8 text-center backdrop-blur-sm">
      <div className="rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/50 dark:text-red-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-8 w-8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Oops, something went wrong
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-[500px]">
          {error?.message || "An unexpected error occurred while loading this page. Our team has been notified."}
        </p>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-slate-200 px-6 py-2 font-medium text-slate-900 transition-colors hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          Try Again
        </button>
        <button
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className="rounded-lg bg-black px-6 py-2 font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default RouteErrorBoundary;
