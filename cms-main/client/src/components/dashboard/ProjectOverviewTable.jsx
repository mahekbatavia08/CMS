import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronUp, ChevronDown } from "lucide-react";
import StatusCell from "./StatusCell";
import CountCell from "./CountCell";
import { ROUTES } from "@/constants/routes";

const ProjectOverviewTable = ({ projects, isLoading, isError }) => {
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const sortedProjects = useMemo(() => {
    let sortableItems = [...projects];
    if (sortConfig !== null && sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a;
        let bValue = b;
        
        // Handle nested paths
        const keys = sortConfig.key.split('.');
        for (let key of keys) {
          aValue = aValue?.[key];
          bValue = bValue?.[key];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [projects, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig?.key === key) {
      return sortConfig.direction === 'asc' ? <ChevronUp className="inline w-3 h-3 ml-1" /> : <ChevronDown className="inline w-3 h-3 ml-1" />;
    }
    return <ChevronUp className="inline w-3 h-3 ml-1 opacity-20 group-hover:opacity-100 transition-opacity" />;
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border p-6 dark:border-slate-800">
        Loading project overview...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border p-6 text-red-500 dark:border-slate-800">
        Failed to load project overview.
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div className="rounded-lg border p-6 dark:border-slate-800">
        No projects found.
      </div>
    );
  }

  const handleCellClick = (projectId, sectionSlug) => {
    navigate(ROUTES.PROJECT_EDIT.replace(":id", projectId) + `?section=${sectionSlug}`);
  };

  return (
    <div className="max-h-[650px] overflow-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm transition-colors">
      <table className="min-w-full border-collapse">
        <thead className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-800 shadow-sm">
          <tr>
            <th
              className="px-5 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => requestSort('projectName')}
            >
              Project {getSortIcon('projectName')}
            </th>

            <th 
              className="px-5 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => requestSort('builderName')}
            >
              Builder {getSortIcon('builderName')}
            </th>

            <th 
              className="px-5 py-4 text-center text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => requestSort('stats.cover')}
            >
              Cover {getSortIcon('stats.cover')}
            </th>

            <th 
              className="px-5 py-4 text-center text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => requestSort('stats.gallery.images')}
            >
              Gallery {getSortIcon('stats.gallery.images')}
            </th>

            <th 
              className="px-5 py-4 text-center text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => requestSort('stats.videos')}
            >
              Videos {getSortIcon('stats.videos')}
            </th>

            <th 
              className="px-5 py-4 text-center text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => requestSort('stats.brochures')}
            >
              Brochures {getSortIcon('stats.brochures')}
            </th>

            <th 
              className="px-5 py-4 text-center text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => requestSort('stats.floorPlans')}
            >
              Floor Plans {getSortIcon('stats.floorPlans')}
            </th>

            <th 
              className="px-5 py-4 text-center text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => requestSort('stats.legalDocuments')}
            >
              Legal Docs {getSortIcon('stats.legalDocuments')}
            </th>

            <th 
              className="px-5 py-4 text-center text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => requestSort('stats.seo')}
            >
              SEO {getSortIcon('stats.seo')}
            </th>

            <th 
              className="px-5 py-4 text-center text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => requestSort('stats.contact')}
            >
              Contact {getSortIcon('stats.contact')}
            </th>

          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
          {sortedProjects.map((project) => (
            <tr
              key={project._id}
              className="group transition-colors hover:bg-blue-50/40 dark:hover:bg-slate-800/60"
            >
              <td
                className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap cursor-pointer hover:underline transition-colors"
                onClick={() => handleCellClick(project._id, "general")}
                title="Edit General Info"
              >
                {project.projectName}
              </td>

              <td 
                className="px-5 py-4 whitespace-nowrap cursor-pointer text-slate-600 dark:text-slate-400 transition-colors"
                onClick={() => handleCellClick(project._id, "general")}
                title="Edit General Info"
              >
                {project.builderName}
              </td>

              <td
                className="px-5 py-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                onClick={() => handleCellClick(project._id, "cover")}
                title="Edit Cover Image"
              >
                <StatusCell value={project.stats.cover} />
              </td>

              <td 
                className="px-5 py-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                onClick={() => handleCellClick(project._id, "gallery")}
                title="Edit Gallery"
              >
                <CountCell value={project.stats.gallery.images} />
              </td>

              <td 
                className="px-5 py-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                onClick={() => handleCellClick(project._id, "videos")}
                title="Edit Videos"
              >
                <CountCell value={project.stats.videos} />
              </td>

              <td 
                className="px-5 py-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                onClick={() => handleCellClick(project._id, "brochure")}
                title="Edit Brochures"
              >
                <CountCell value={project.stats.brochures} />
              </td>

              <td
                className="px-5 py-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                onClick={() => handleCellClick(project._id, "floorplans")}
                title="Edit Floor Plans"
              >
                <CountCell value={project.stats.floorPlans} />
              </td>

              <td 
                className="px-5 py-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                onClick={() => handleCellClick(project._id, "legal")}
                title="Edit Legal Docs"
              >
                <CountCell value={project.stats.legalDocuments} />
              </td>

              <td 
                className="px-5 py-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                onClick={() => handleCellClick(project._id, "seo")}
                title="Edit SEO"
              >
                <StatusCell value={project.stats.seo} />
              </td>

              <td 
                className="px-5 py-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                onClick={() => handleCellClick(project._id, "contact")}
                title="Edit Contact"
              >
                <StatusCell value={project.stats.contact} />
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectOverviewTable;