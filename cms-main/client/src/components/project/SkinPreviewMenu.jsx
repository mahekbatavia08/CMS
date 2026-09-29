import { useLocation, useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import { ROUTES } from "@/constants/routes";

// Eye button: opens Master's Individual Skin directly
const SkinPreviewMenu = ({ projectId, triggerClassName = "" }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const openPreview = () => {
    navigate(ROUTES.PROJECT_MAP_PREVIEW.replace(":id", projectId), {
      state: { backTo: location.pathname + location.search, standalone: false },
    });
  };

  return (
    <button
      type="button"
      title="View Master's Individual Skin"
      onClick={openPreview}
      className={
        triggerClassName ||
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-input bg-background text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
      }
    >
      <Eye size={15} />
    </button>
  );
};

export default SkinPreviewMenu;