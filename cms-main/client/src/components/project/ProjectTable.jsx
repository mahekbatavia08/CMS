import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, Edit, Star, Trash2 } from "lucide-react";
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
import { getImageUrl } from "@/lib/utils";

const statusStyles = {
  Draft: "bg-yellow-100 text-yellow-700",
  Published: "bg-green-100 text-green-700",
  Archived: "bg-slate-200 text-slate-700",
};

const ProjectTable = ({ projects }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const visibleIds = projects.map((p) => p._id);
  const isAllSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleToggleRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async (e) => {
    e?.preventDefault();
    if (selectedIds.length === 0 || isDeleting) return;

    try {
      setIsDeleting(true);
      await Promise.all(selectedIds.map((id) => projectService.deleteProject(id)));
      toast.success(
        `${selectedIds.length} ${selectedIds.length === 1 ? "project" : "projects"} deleted successfully.`
      );
      setSelectedIds([]);
      setIsBulkDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        error.message ||
        "Failed to delete selected projects."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (id) => {
    navigate(
      ROUTES.PROJECT_EDIT.replace(":id", id)
    );
  };

  const handleView = (id) => {
    navigate(
      ROUTES.PROJECT_VIEW.replace(":id", id)
    );
  };

  return (
    <div className="overflow-x-auto rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 text-sm transition-colors animate-in fade-in duration-150">
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
                    This action can be reversed directly from the database because projects are soft deleted.
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

      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="w-12 px-4 py-2.5 text-center">
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleToggleAll}
                  className="cursor-pointer"
                  aria-label="Select all"
                />
              </div>
            </th>
            <th className="px-4 py-2.5 text-left">
              Project
            </th>
            <th className="px-4 py-2.5 text-left">
              Type
            </th>
            <th className="px-4 py-2.5 text-left">
              Status
            </th>
            <th className="px-4 py-2.5 text-left">
              Featured
            </th>
            <th className="px-4 py-2.5 text-left">
              Updated
            </th>
            <th className="px-4 py-2.5 text-center">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {projects.map((project) => (
            <tr
              key={project._id}
              className={`transition hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                selectedIds.includes(project._id) ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
              }`}
            >
              <td className="w-12 px-4 py-2.5 text-center">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={selectedIds.includes(project._id)}
                    onCheckedChange={() => handleToggleRow(project._id)}
                    className="cursor-pointer"
                    aria-label={`Select ${project.general?.projectName || "project"}`}
                  />
                </div>
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                    {project.media?.coverImage?.url ? (
                      <img
                        src={getImageUrl(project.media.coverImage.url)}
                        alt={
                          project.media.coverImage.alt ||
                          project.general?.projectName
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-slate-400 font-medium">
                        No Image
                      </div>
                    )}
                  </div>

                  <div>
                    <h3
                      className={`font-semibold text-slate-900 dark:text-slate-100 ${
                        project.projectCategory ===
                        "portfolio"
                          ? "text-blue-600 dark:text-blue-400"
                          : ""
                      }`}
                    >
                      {project.general?.projectName || "Untitled"}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {project.general?.builderName || "—"}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-4 py-2.5 align-middle">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    project.projectCategory ===
                    "portfolio"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                  }`}
                >
                  {project.projectCategory ===
                  "portfolio"
                    ? "Portfolio Tour"
                    : "Individual Project"}
                </span>
              </td>

              <td className="px-4 py-2.5">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    statusStyles[
                      project.status.status
                    ]
                  }`}
                >
                  {project.status.status}
                </span>
              </td>

              <td className="px-4 py-2.5">
                {project.status.featured ? (
                  <div className="flex items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                    <Star
                      className="fill-yellow-500"
                      size={14}
                    />
                    Yes
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">-</span>
                )}
              </td>

              <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                {new Date(
                  project.updatedAt
                ).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </td>

              <td className="px-4 py-2.5">
                <div className="flex justify-center gap-1.5">
                  <Button
                    size="icon-sm"
                    variant="outline"
                    title="Edit Project"
                    onClick={() =>
                      handleEdit(project._id)
                    }
                  >
                    <Edit size={15} />
                  </Button>

                  <Button
                    size="icon-sm"
                    variant="outline"
                    title="View Project"
                    onClick={() =>
                      handleView(project._id)
                    }
                  >
                    <BadgeCheck size={16} />
                  </Button>

                  <DeleteProjectDialog
                    project={project}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectTable;