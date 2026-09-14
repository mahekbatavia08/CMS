import React, { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Edit, 
  ArrowLeft,
  Loader2,
  FolderKanban,
  Star,
  Map,
  BadgeCheck
} from "lucide-react";

import { ROUTES } from "@/constants/routes";
import projectService from "@/services/project/projectService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DeleteProjectDialog from "@/components/project/DeleteProjectDialog";
import { getImageUrl } from "@/lib/utils";
import StatusCell from "@/components/dashboard/StatusCell";
import CountCell from "@/components/dashboard/CountCell";

const statusStyles = {
  Published: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
  Draft: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
  Archived: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
};

// Mirrors the server's buildProjectOverview (server/services/projectService.js)
// so this page can show the same per-field completeness indicators as the
// Dashboard's Project Overview.
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

const PortfolioProjects = () => {
  const { portfolioId } = useParams();
  const navigate = useNavigate();

  const [portfolio, setPortfolio] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch current portfolio
      const portRes = await projectService.getProject(portfolioId);
      const portData = portRes.data?.project || portRes.project || portRes.data;
      setPortfolio(portData);

      // 2. Fetch all child projects belonging to this portfolio
      const projRes = await projectService.getProjects({ 
        parentProject: portfolioId,
        limit: 1000 
      });
      const projList = projRes.data?.items || projRes.data?.projects || projRes.items || projRes.projects || [];
      setProjects(projList);
    } catch (err) {
      console.error("Error loading portfolio projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (portfolioId) {
      loadData();
    }
  }, [portfolioId]);

  // Extract unique filter options from actual projects
  const filterOptions = useMemo(() => {
    const cats = new Set();
    const types = new Set();

    projects.forEach((p) => {
      if (Array.isArray(p.filters?.category)) {
        p.filters.category.forEach((c) => cats.add(c));
      } else if (p.filters?.category) {
        cats.add(p.filters.category);
      }

      if (Array.isArray(p.filters?.propertyType)) {
        p.filters.propertyType.forEach((t) => types.add(t));
      } else if (p.filters?.propertyType) {
        types.add(p.filters.propertyType);
      }
    });

    return {
      categories: Array.from(cats),
      types: Array.from(types),
    };
  }, [projects]);

  // Client-side filtering
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Search
      const name = p.general?.projectName || "";
      const builder = p.general?.builderName || "";
      const searchStr = typeof search === "string" ? search : (search ? String(search) : "");
      const matchesSearch =
        searchStr.trim() === "" ||
        name.toLowerCase().includes(searchStr.toLowerCase()) ||
        builder.toLowerCase().includes(searchStr.toLowerCase());

      // Status
      const status = p.status?.status || "Draft";
      const matchesStatus = statusFilter === "all" || status === statusFilter;

      // Category
      const pCats = Array.isArray(p.filters?.category)
        ? p.filters.category
        : (p.filters?.category ? [p.filters.category] : []);
      const matchesCat = categoryFilter === "all" || pCats.includes(categoryFilter);

      // Property Type
      const pTypes = Array.isArray(p.filters?.propertyType)
        ? p.filters.propertyType
        : (p.filters?.propertyType ? [p.filters.propertyType] : []);
      const matchesType = typeFilter === "all" || pTypes.includes(typeFilter);

      return matchesSearch && matchesStatus && matchesCat && matchesType;
    });
  }, [projects, search, statusFilter, categoryFilter, typeFilter]);

  // Reset to page 1 whenever the filtered result set changes
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, categoryFilter, typeFilter]);

  const totalItems = filteredProjects.length;
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const paginatedProjects = useMemo(() => {
    return filteredProjects.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredProjects, currentPage]);

  const handleEdit = (id) => {
    navigate(ROUTES.PROJECT_EDIT.replace(":id", id));
  };

  const handleView = (id) => {
    navigate(ROUTES.PROJECT_VIEW.replace(":id", id));
  };

  const handleSectionClick = (id, sectionSlug) => {
    navigate(ROUTES.PROJECT_EDIT.replace(":id", id) + `?section=${sectionSlug}`);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link to={ROUTES.PROJECTS_MASTER} className="hover:text-slate-900 dark:hover:text-slate-100 transition">
          Master Projects
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-xs">
          {portfolio?.general?.projectName || "Portfolio Projects"}
        </span>
      </nav>

      {/* Header with Title and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold dark:text-slate-50">
              {portfolio?.general?.projectName || "Portfolio"}
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              {projects.length} {projects.length === 1 ? "Project" : "Projects"}
            </span>
          </div>
          {portfolio?.general?.description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              {portfolio.general.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.PROJECT_EDIT.replace(":id", portfolioId))}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Edit size={16} />
            <span>Edit Information</span>
          </Button>

          <Button
            onClick={() => navigate(ROUTES.PROJECT_MAP_PREVIEW.replace(":id", portfolioId), { state: { from: ROUTES.PROJECTS_MASTER } })}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
          >
            <Map size={16} />
            <span>Edit Map</span>
          </Button>

          <Link to={`${ROUTES.PROJECT_CREATE}?type=individual&portfolioId=${portfolioId}`}>
            <Button className="flex items-center gap-2 bg-black hover:bg-slate-800 text-white dark:bg-white dark:text-black dark:hover:bg-slate-200 cursor-pointer">
              <Plus size={18} />
              <span>Add Project</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Search projects by name, builder..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          {filterOptions.categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="all">All Categories</option>
              {filterOptions.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Property Type Filter */}
          {filterOptions.types.length > 0 && (
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="all">All Types</option>
              {filterOptions.types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="all">All Status</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Archived">Archived</option>
          </select>

          {(search || statusFilter !== "all" || categoryFilter !== "all" || typeFilter !== "all") && (
            <Button
              variant="ghost"
              className="text-xs text-slate-500 hover:text-slate-900"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setCategoryFilter("all");
                setTypeFilter("all");
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Projects Table */}
      {isLoading ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-16 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400 mb-3" />
          <p className="text-base font-medium text-slate-600 dark:text-slate-300">
            Loading portfolio projects...
          </p>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-16 text-center">
          <FolderKanban className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">No Projects in this Portfolio</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Get started by adding projects to this master portfolio.
          </p>
          <Link to={`${ROUTES.PROJECT_CREATE}?type=individual&portfolioId=${portfolioId}`} className="mt-6 inline-block">
            <Button>Add First Project</Button>
          </Link>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
          <p className="text-base font-medium text-slate-700 dark:text-slate-300">No matching projects found</p>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Try adjusting your search query or clear filters.
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setTypeFilter("all");
              setCategoryFilter("all");
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-2.5 whitespace-nowrap">Project</th>
                <th className="px-4 py-2.5 whitespace-nowrap">Builder</th>
                <th className="px-4 py-2.5 whitespace-nowrap">Category</th>
                <th className="px-4 py-2.5 whitespace-nowrap">Property Type</th>
                <th className="px-4 py-2.5 whitespace-nowrap">Area</th>
                <th className="px-4 py-2.5 whitespace-nowrap">Status</th>
                <th className="px-4 py-2.5 whitespace-nowrap">Updated</th>
                <th className="px-4 py-2.5 text-center whitespace-nowrap">Cover</th>
                <th className="px-4 py-2.5 text-center whitespace-nowrap">Gallery</th>
                <th className="px-4 py-2.5 text-center whitespace-nowrap">Videos</th>
                <th className="px-4 py-2.5 text-center whitespace-nowrap">Brochures</th>
                <th className="px-4 py-2.5 text-center whitespace-nowrap">Floor Plans</th>
                <th className="px-4 py-2.5 text-center whitespace-nowrap">Legal Docs</th>
                <th className="px-4 py-2.5 text-center whitespace-nowrap">Contact</th>
                <th className="px-4 py-2.5 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {paginatedProjects.map((project) => {
                const projectCategories = Array.isArray(project.filters?.category)
                  ? project.filters.category
                  : (project.filters?.category ? [project.filters.category] : []);

                const propertyTypes = Array.isArray(project.filters?.propertyType)
                  ? project.filters.propertyType
                  : (project.filters?.propertyType ? [project.filters.propertyType] : []);

                const areaDisplay = project.general?.area || (Array.isArray(project.filters?.area) ? project.filters.area.join(", ") : project.filters?.area) || "-";

                const stats = computeProjectStats(project);

                return (
                  <tr key={project._id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    {/* Project Name & Thumbnail */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                          {project.media?.coverImage?.url ? (
                            <img
                              src={getImageUrl(project.media.coverImage.url)}
                              alt={project.general?.projectName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-slate-400 font-medium">
                              No Image
                            </div>
                          )}
                        </div>

                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {project.general?.projectName || "Untitled Project"}
                          </h3>
                          <p className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                            {project.location?.city ? `${project.location.city}` : "Surat"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Builder */}
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 font-medium text-xs whitespace-nowrap">
                      {project.general?.builderName || project.general?.projectName || "—"}
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

                    {/* Area */}
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 text-xs font-medium">
                      {areaDisplay}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[project.status?.status] || statusStyles.Draft}`}>
                        {project.status?.status || "Draft"}
                      </span>
                    </td>

                    {/* Updated */}
                    <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(project.updatedAt || project.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Cover */}
                    <td
                      className="px-4 py-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => handleSectionClick(project._id, "cover")}
                      title="Edit Cover Image"
                    >
                      <StatusCell value={stats.cover} />
                    </td>

                    {/* Gallery */}
                    <td
                      className="px-4 py-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => handleSectionClick(project._id, "gallery")}
                      title="Edit Gallery"
                    >
                      <CountCell value={stats.gallery.images} />
                    </td>

                    {/* Videos */}
                    <td
                      className="px-4 py-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => handleSectionClick(project._id, "videos")}
                      title="Edit Videos"
                    >
                      <CountCell value={stats.videos} />
                    </td>

                    {/* Brochures */}
                    <td
                      className="px-4 py-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => handleSectionClick(project._id, "brochure")}
                      title="Edit Brochures"
                    >
                      <CountCell value={stats.brochures} />
                    </td>

                    {/* Floor Plans */}
                    <td
                      className="px-4 py-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => handleSectionClick(project._id, "floorplans")}
                      title="Edit Floor Plans"
                    >
                      <CountCell value={stats.floorPlans} />
                    </td>

                    {/* Legal Docs */}
                    <td
                      className="px-4 py-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => handleSectionClick(project._id, "legal")}
                      title="Edit Legal Docs"
                    >
                      <CountCell value={stats.legalDocuments} />
                    </td>

                    {/* Contact */}
                    <td
                      className="px-4 py-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => handleSectionClick(project._id, "contact")}
                      title="Edit Contact"
                    >
                      <StatusCell value={stats.contact} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2.5">
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
                          title="View Project"
                          onClick={() => handleView(project._id)}
                        >
                          <BadgeCheck size={15} />
                        </Button>

                        <DeleteProjectDialog 
                          project={project} 
                          onDeleted={loadData}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && filteredProjects.length > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 gap-4 shadow-sm">
          <div className="text-sm text-slate-600 dark:text-slate-300 text-center md:text-left">
            Showing <strong className="font-semibold text-slate-900 dark:text-slate-100">{startItem}</strong> -{" "}
            <strong className="font-semibold text-slate-900 dark:text-slate-100">{endItem}</strong> of{" "}
            <strong className="font-semibold text-slate-900 dark:text-slate-100">{totalItems}</strong> projects
          </div>

          <div className="flex items-center gap-3">
            <select
              value={currentPage}
              onChange={(e) => setPage(Number(e.target.value))}
              className="h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const rangeStart = (pageNum - 1) * pageSize + 1;
                const rangeEnd = Math.min(pageNum * pageSize, totalItems);
                return (
                  <option key={pageNum} value={pageNum}>
                    {rangeStart}-{rangeEnd}
                  </option>
                );
              })}
            </select>

            <span className="text-sm font-medium whitespace-nowrap text-slate-700 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioProjects;
