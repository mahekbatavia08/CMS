import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import projectService from "@/services/project/projectService";

import { Button } from "@/components/ui/button";

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

const DeleteProjectDialog = ({
    project,
    onDeleted,
    label,
    triggerClassName,
    isPortfolio: isPortfolioProp,
}) => {
    const queryClient = useQueryClient();

    const [isDeleting, setIsDeleting] = useState(false);

    const isPortfolio =
        isPortfolioProp ??
        (project?.projectCategory === "portfolio" ||
            project?.type === "portfolio");
    const entityName = isPortfolio ? "Portfolio" : "Project";
    const entityNameLower = isPortfolio ? "portfolio" : "project";

    const handleDelete = async () => {
        try {
            setIsDeleting(true);

            const response = await projectService.deleteProject(project._id);

            toast.success(
                response.message || `${entityName} deleted successfully.`
            );

            queryClient.invalidateQueries({
                queryKey: ["projects"],
            });
            if (isPortfolio) {
                queryClient.invalidateQueries({
                    queryKey: ["masterPortfolios"],
                });
                queryClient.invalidateQueries({
                    queryKey: ["allProjectsForMasterCounts"],
                });
            }

            if (onDeleted) onDeleted();
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                error.message ||
                `Failed to delete ${entityNameLower}.`
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const defaultTriggerCls =
        "inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100";

    return (
        <AlertDialog>
            <AlertDialogTrigger
                className={triggerClassName || defaultTriggerCls}
                title={`Delete ${entityName}`}
            >
                <Trash2 size={14} />
                {label && <span className="ml-1">{label}</span>}
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Delete {entityName}?
                    </AlertDialogTitle>

                    <AlertDialogDescription>
                        This will remove{" "}
                        <strong>
                            {project.general?.projectName || `this ${entityNameLower}`}
                        </strong>{" "}
                        {isPortfolio
                            ? "from the active portfolios."
                            : "from the active portfolio."}

                        <br />
                        <br />

                        This action can be reversed directly from the
                        database because the {entityNameLower} is soft deleted.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel>
                        Cancel
                    </AlertDialogCancel>

                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isDeleting
                            ? "Deleting..."
                            : `Delete ${entityName}`}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteProjectDialog;