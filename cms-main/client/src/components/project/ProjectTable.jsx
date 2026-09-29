import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Edit, Eye, Map, MapPinned, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import projectService from "@/services/project/projectService";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ROUTES } from "@/constants/routes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import DeleteProjectDialog from "./DeleteProjectDialog";
import { cn, getImageUrl } from "@/lib/utils";
import StatusCell from "@/components/dashboard/StatusCell";
import CountCell from "@/components/dashboard/CountCell";

const possessionStyles = {
  "Ongoing": "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
  "Coming Soon": "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
  "Ready Position": "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
};

// "Ready Position" is the stored value; show the intended wording.
const possessionLabels = {
  "Ready Position": "Ready Possession",
};

// Header cells stick to the top of the table's scroll area. Backgrounds are
// opaque so rows never show through while scrolling.
const thClass =
  "sticky top-0 z-10 px-4 py-2.5 whitespace-nowrap bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700";

// The checkbox (w-12) and edit columns are pinned to the left.
const pinnedCheckboxClass = "sticky left-0 w-12 min-w-12 px-4";
const pinnedEditClass = "sticky left-12 border-r border-slate-200 dark:border-slate-700";

const sectionCellClass =
  "px-4 py-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors";

// Row backgrounds are opaque and mirrored on the pinned cells, so the
// selected/hover highlight covers the whole row (selected wins over hover).
const getRowBgClass = (isSelected) =>
  isSelected
    ? "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900"
    : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800";

const getPinnedCellBgClass = (isSelected) =>
  isSelected
    ? "bg-blue-50 group-hover:bg-blue-100 dark:bg-blue-950 dark:group-hover:bg-blue-900"
    : "bg-white group-hover:bg-slate-50 dark:bg-slate-900 dark:group-hover:bg-slate-800";

const formatDate = (value) => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Mirrors the server's buildProjectOverview so this page shows the same
// per-field completeness indicators as the Dashboard and PortfolioProjects.
const computeProjectStats = (project) => {
  const galleryImages =
    project.media?.gallery?.reduce(
      (total, album) => total + (album.images?.length ?? 0),
      0,
    ) ?? 0;

  return {
    cover: !!project.media?.coverImage?.url,
    gallery: { images: galleryImages },
    videos: project.videos?.length ?? 0,
    brochures: project.brochures?.length ?? 0,
    floorPlans: project.floorPlans?.length ?? 0,
    legalDocuments: project.legalDocuments?.length ?? 0,
    contact: !!project.contact?.email,
  };
};

const CoverThumbnail = ({ project }) => {
  const url = project.media?.coverImage?.url;
  const [failedUrl, setFailedUrl] = useState(null);

  return (
    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
      {url && failedUrl !== url ? (
        <img
          src={getImageUrl(url)}
          alt={project.media.coverImage.alt || project.general?.projectName || "Cover image"}
          className="h-full w-full object-cover"
          onError={() => setFailedUrl(url)}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-center text-[9px] leading-tight text-slate-400 font-medium">
          No Image
        </div>
      )}
    </div>
  );
};

const ProjectTable = ({ projects, className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const visibleIds = projects.map((p) => p._id);
  const isAllSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  // Drop selections that are no longer on screen (page, filter or search
  // changed) so the count and bulk delete only cover visible projects.
  const [prevProjects, setPrevProjects] = useState(projects);
  if (prevProjects !== projects) {
    setPrevProjects(projects);
    const next = selectedIds.filter((id) => visibleIds.includes(id));
    if (next.length !== selectedIds.length) setSelectedIds(next);
  }

  const handleToggleAll = () => {
    setSelectedIds(isAllSelected ? [] : visibleIds);
  };

  const handleToggleRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async (e) => {
    e?.preventDefault();
    if (selectedIds.length === 0 || isDeleting) return;

    const ids = [...selectedIds];

    try {
      setIsDeleting(true);
      const results = await Promise.allSettled(ids.map((id) => projectService.deleteProject(id)));
      const failedIds = ids.filter((_, i) => results[i].status === "rejected");
      const deletedCount = ids.length - failedIds.length;

      if (deletedCount > 0) {
        toast.success(
          `${deletedCount} ${deletedCount === 1 ? "project" : "projects"} deleted successfully.`
        );
      }

      if (failedIds.length > 0) {
        const firstError = results.find((r) => r.status === "rejected")?.reason;
        toast.error(
          `Failed to delete ${failedIds.length} ${failedIds.length === 1 ? "project" : "projects"}. ` +
          (firstError?.response?.data?.message || firstError?.message || "")
        );
        // Keep only the failed ones selected so the user can retry.
        setSelectedIds(failedIds);
      } else {
        setSelectedIds([]);
        setIsBulkDeleteOpen(false);
      }

      queryClient.invalidateQueries({ queryKey: ["projects"] });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (id) => {
    navigate(ROUTES.PROJECT_EDIT.replace(":id", id));
  };

  const handleView = (id) => {
    navigate(ROUTES.PROJECT_VIEW.replace(":id", id));
  };

  const handleMapPreview = (id) => {
    navigate(ROUTES.PROJECT_MAP_PREVIEW.replace(":id", id), {
      state: { backTo: location.pathname + location.search },
    });
  };

  const handleMapSkin = (id) => {
    navigate(ROUTES.PROJECT_MAP_SKIN.replace(":id", id));
  };

  const handleSectionClick = (id, sectionSlug) => {
    navigate(ROUTES.PROJECT_EDIT.replace(":id", id) + `?section=${sectionSlug}`);
  };

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm",
        className
      )}
    >
      {/* Bulk actions sit outside the scroll area so they stay visible */}
      {selectedIds.length > 0 && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 text-sm transition-colors animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/60 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
              {selectedIds.length}
            </span>
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {selectedIds.length === 1 ? "project selected" : "projects selected"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="h-8 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            >
              Deselect All
            </Button>

            <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-8 text-xs flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Delete Selected ({selectedIds.length})</span>
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete {selectedIds.length} {selectedIds.length === 1 ? "Project" : "Projects"}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove the {selectedIds.length === 1 ? "selected project" : `${selectedIds.length} selected projects`} from the active portfolio.
                    <br /><br />
                    Projects are soft deleted, so an administrator can restore them later if needed.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isDeleting ? "Deleting..." : `Delete ${selectedIds.length} ${selectedIds.length === 1 ? "Project" : "Projects"}`}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      {/* Single scroll area for both axes: sticky header and pinned columns work against it */}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full text-left border-separate border-spacing-0 text-sm">
          <thead className="text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">
            <tr>
              {/* Checkbox (pinned) */}
              <th className={cn(thClass, pinnedCheckboxClass, "z-20 text-center")}>
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isSomeSelected}
                    onCheckedChange={handleToggleAll}
                    className="cursor-pointer"
                    aria-label="Select all"
                  />
                </div>
              </th>
              {/* Edit + map preview (pinned) */}
              <th className={cn(thClass, pinnedEditClass, "z-20 text-center")}>
                Edit / Map
              </th>
              <th className={thClass}>Project</th>
              <th className={thClass}>Category</th>
              <th className={thClass}>Property Type</th>
              <th className={thClass}>Possession Status</th>
              <th className={thClass}>Updated</th>
              <th className={cn(thClass, "text-center")}>Cover</th>
              <th className={cn(thClass, "text-center")}>Gallery</th>
              <th className={cn(thClass, "text-center")}>Videos</th>
              <th className={cn(thClass, "text-center")}>Brochures</th>
              <th className={cn(thClass, "text-center")}>Floor Plans</th>
              <th className={cn(thClass, "text-center")}>Legal Docs</th>
              <th className={cn(thClass, "text-center")}>Contact</th>
              <th className={cn(thClass, "text-center")}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {projects.map((project) => {
              const projectCategories = Array.isArray(project.filters?.category)
                ? project.filters.category
                : (project.filters?.category ? [project.filters.category] : []);

              const propertyTypes = Array.isArray(project.filters?.propertyType)
                ? project.filters.propertyType
                : (project.filters?.propertyType ? [project.filters.propertyType] : []);

              const possession = project.filters?.possessionStatus || "";
              const stats = computeProjectStats(project);
              const isSelected = selectedIds.includes(project._id);
              const rowBgClass = getRowBgClass(isSelected);
              const pinnedBgClass = getPinnedCellBgClass(isSelected);
              const projectName = project.general?.projectName || "Untitled";

              return (
                <tr
                  key={project._id}
                  className={cn(
                    "group transition-colors [&>td]:border-b [&>td]:border-slate-100 dark:[&>td]:border-slate-800 last:[&>td]:border-b-0",
                    rowBgClass
                  )}
                >
                  {/* Checkbox (pinned) */}
                  <td className={cn(pinnedCheckboxClass, "z-[5] py-2.5 text-center transition-colors", pinnedBgClass)}>
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleRow(project._id)}
                        className="cursor-pointer"
                        aria-label={`Select ${project.general?.projectName || "project"}`}
                      />
                    </div>
                  </td>

                  {/* Edit + map preview (pinned) */}
                  <td className={cn(pinnedEditClass, "z-[5] px-4 py-2.5 transition-colors", pinnedBgClass)}>
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        size="icon-sm"
                        variant="outline"
                        title="Edit Project"
                        onClick={() => handleEdit(project._id)}
                      >
                        <Edit size={15} />
                      </Button>

                      <Button
                        size="icon-sm"
                        variant="outline"
                        title="Map Preview"
                        onClick={() => handleMapPreview(project._id)}
                      >
                        <MapPinned size={15} />
                      </Button>
                    </div>
                  </td>

                  {/* Project Name & Thumbnail */}
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <CoverThumbnail project={project} />

                      <div className="min-w-0 max-w-[240px]">
                        <h3
                          className="truncate font-semibold text-slate-900 dark:text-slate-100"
                          title={projectName}
                        >
                          {projectName}
                        </h3>
                        <p
                          className="truncate text-xs text-slate-500 dark:text-slate-400"
                          title={project.general?.builderName || undefined}
                        >
                          {project.general?.builderName || "—"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {projectCategories.length > 0 ? (
                        projectCategories.map((cat) => (
                          <span
                            key={cat}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                          >
                            {cat}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">-</span>
                      )}
                    </div>
                  </td>

                  {/* Property Type */}
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {propertyTypes.length > 0 ? (
                        propertyTypes.map((type) => (
                          <span
                            key={type}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                          >
                            {type}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">-</span>
                      )}
                    </div>
                  </td>

                  {/* Possession Status */}
                  <td className="px-4 py-2.5">
                    {possession ? (
                      <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${possessionStyles[possession] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"}`}>
                        {possessionLabels[possession] || possession}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">-</span>
                    )}
                  </td>

                  {/* Updated */}
                  <td className="px-4 py-2.5 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(project.updatedAt || project.createdAt)}
                  </td>

                  {/* Cover */}
                  <td
                    className={sectionCellClass}
                    onClick={() => handleSectionClick(project._id, "cover")}
                    title="Edit Cover Image"
                  >
                    <StatusCell value={stats.cover} />
                  </td>

                  {/* Gallery */}
                  <td
                    className={sectionCellClass}
                    onClick={() => handleSectionClick(project._id, "gallery")}
                    title="Edit Gallery"
                  >
                    <CountCell value={stats.gallery.images} />
                  </td>

                  {/* Videos */}
                  <td
                    className={sectionCellClass}
                    onClick={() => handleSectionClick(project._id, "videos")}
                    title="Edit Videos"
                  >
                    <CountCell value={stats.videos} />
                  </td>

                  {/* Brochures */}
                  <td
                    className={sectionCellClass}
                    onClick={() => handleSectionClick(project._id, "brochure")}
                    title="Edit Brochures"
                  >
                    <CountCell value={stats.brochures} />
                  </td>

                  {/* Floor Plans */}
                  <td
                    className={sectionCellClass}
                    onClick={() => handleSectionClick(project._id, "floorplans")}
                    title="Edit Floor Plans"
                  >
                    <CountCell value={stats.floorPlans} />
                  </td>

                  {/* Legal Docs */}
                  <td
                    className={sectionCellClass}
                    onClick={() => handleSectionClick(project._id, "legal")}
                    title="Edit Legal Docs"
                  >
                    <CountCell value={stats.legalDocuments} />
                  </td>

                  {/* Contact */}
                  <td
                    className={sectionCellClass}
                    onClick={() => handleSectionClick(project._id, "contact")}
                    title="Edit Contact"
                  >
                    <StatusCell value={stats.contact} />
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-2.5">
                    <div className="flex justify-center gap-1.5">
                      <Button
                        size="icon-sm"
                        variant="outline"
                        title="View Project"
                        onClick={() => handleView(project._id)}
                      >
                        <Eye size={15} />
                      </Button>

                      <Button
                        size="icon-sm"
                        variant="outline"
                        title="Select Map Skin"
                        onClick={() => handleMapSkin(project._id)}
                      >
                        <Map size={15} />
                      </Button>

                      <DeleteProjectDialog project={project} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectTable;
