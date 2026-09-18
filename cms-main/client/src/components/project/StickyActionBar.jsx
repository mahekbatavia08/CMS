import { Loader2, ArrowLeft } from "lucide-react";

const StickyActionBar = ({
  isSubmitting,
  submitButtonText = "Save Changes",
  onSubmit,
  onCancel,
  onBack,
  onNext,
  nextButtonText = "Next →",
  isNextSubmitting = false,
  hideSubmit = false,
}) => {
  const isAnySubmitting = isSubmitting || isNextSubmitting;

  return (
    <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-50 flex flex-wrap items-center justify-between gap-3 sm:gap-4 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 p-4 backdrop-blur-md shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_6px_-1px_rgba(255,255,255,0.05)]">
      <div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isAnySubmitting}
            className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 sm:px-6 py-2.5 font-medium text-slate-800 dark:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isAnySubmitting}
            className="rounded-lg px-4 sm:px-6 py-2.5 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
        )}
        
        {!hideSubmit && (
          <button
            type={onSubmit ? "button" : "submit"}
            onClick={onSubmit}
            disabled={isAnySubmitting}
            className={
              onNext
                ? "flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 sm:px-6 py-2.5 font-medium text-slate-800 dark:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                : "flex items-center gap-2 rounded-lg bg-black dark:bg-white px-6 sm:px-8 py-2.5 font-medium text-white dark:text-black transition-colors hover:bg-slate-800 dark:hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            }
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Saving..." : submitButtonText}
          </button>
        )}

        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={isAnySubmitting}
            className="flex items-center gap-2 rounded-lg bg-black dark:bg-white px-6 sm:px-8 py-2.5 font-medium text-white dark:text-black transition-colors hover:bg-slate-800 dark:hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {isNextSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isNextSubmitting ? "Saving..." : nextButtonText}
          </button>
        )}
      </div>
    </div>
  );
};

export default StickyActionBar;

