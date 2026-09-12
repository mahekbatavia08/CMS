import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FolderKanban,
  Layers,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  Loader2,
  Map,
  Share2,
} from "lucide-react";

import { ROUTES } from "@/constants/routes";
import projectService from "@/services/project/projectService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ImportExportPortfolios from "@/components/project/ImportExportPortfolios";
import DeleteProjectDialog from "@/components/project/DeleteProjectDialog";
import { getImageUrl } from "@/lib/utils";
import { exportSinglePortfolioZip } from "@/lib/portfolioZipExport";

/** Small wrapper so delete invalidates the master-project query cache */
const DeletePortfolioButton = ({ portfolio }) => {
  const queryClient = useQueryClient();

  const handleDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ["masterPortfolios"] });
    queryClient.invalidateQueries({ queryKey: ["allProjectsForMasterCounts"] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  return (
    <DeleteProjectDialog
      project={portfolio}
      isPortfolio={true}
      onDeleted={handleDeleted}
      triggerClassName="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/15 hover:bg-red-500/80 text-white/80 hover:text-white backdrop-blur-sm border border-white/20 transition-all duration-150 cursor-pointer shrink-0"
    />
  );
};

/** Per-card export ZIP icon — floats top-right on the thumbnail */
const ExportPortfolioZipButton = ({ portfolio, childProjects }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (e) => {
    e.stopPropagation();
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportSinglePortfolioZip(portfolio, childProjects);
    } catch (err) {
      console.error("ZIP export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      title="Export portfolio as ZIP"
      className="absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full text-white hover:scale-110 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
    </button>
  );
};

const MasterProjects = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleImported = async () => {
    await queryClient.invalidateQueries({ queryKey: ["masterPortfolios"] });
    await queryClient.invalidateQueries({ queryKey: ["allProjectsForMasterCounts"] });
  };

  // Fetch all portfolio tours
  const {
    data: portfoliosData,
    isLoading: isPortfoliosLoading
  } = useQuery({
    queryKey: ["masterPortfolios"],
    queryFn: projectService.getPortfolioTours,
    staleTime: 0,
    refetchOnMount: "always",
  });

  // Fetch all projects to compute counts and types per portfolio
  const {
    data: allProjectsData,
    isLoading: isAllProjectsLoading
  } = useQuery({
    queryKey: ["allProjectsForMasterCounts"],
    queryFn: () => projectService.getProjects({ limit: 1000, projectCategory: "individual", includeSubProjects: true }),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const portfolios = useMemo(() => {
    return portfoliosData?.data?.items || portfoliosData?.data?.projects || portfoliosData?.items || portfoliosData?.projects || [];
  }, [portfoliosData]);

  const allProjects = useMemo(() => {
    return allProjectsData?.data?.items || allProjectsData?.data?.projects || allProjectsData?.items || allProjectsData?.projects || [];
  }, [allProjectsData]);

  const isLoading = isPortfoliosLoading || isAllProjectsLoading;

  // Aggregate project statistics per portfolio
  const portfolioStats = useMemo(() => {
    const statsMap = {};

    portfolios.forEach((portfolio) => {
      const childProjects = allProjects.filter(
        (p) =>
          String(p.parentProject) === String(portfolio._id) ||
          String(p.parentProject?._id) === String(portfolio._id)
      );

      const typesSet = new Set();
      const categoriesSet = new Set();
      let publishedCount = 0;
      let draftCount = 0;

      childProjects.forEach((p) => {
        if (Array.isArray(p.filters?.category)) {
          p.filters.category.forEach((cat) => categoriesSet.add(cat));
        } else if (p.filters?.category) {
          categoriesSet.add(p.filters.category);
        }

        if (Array.isArray(p.filters?.propertyType)) {
          p.filters.propertyType.forEach((type) => typesSet.add(type));
        } else if (p.filters?.propertyType) {
          typesSet.add(p.filters.propertyType);
        }

        if (p.status?.status === "Published" || p.status?.published) publishedCount++;
        else draftCount++;
      });

      statsMap[portfolio._id] = {
        count: childProjects.length,
        types: Array.from(typesSet),
        categories: Array.from(categoriesSet),
        publishedCount,
        draftCount,
      };
    });

    return statsMap;
  }, [portfolios, allProjects]);

  return (
    <div className="space-y-8 pb-12">
      {/* Breadcrumb & Header */}
      <div>
        <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
          <Link to={ROUTES.DASHBOARD} className="hover:text-slate-900 dark:hover:text-slate-100 transition">
            Dashboard
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">Master Project</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold dark:text-slate-50">Master Projects</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Manage master portfolios, explore interactive map skin galleries, and view associated projects.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ImportExportPortfolios portfolios={portfolios} allProjects={allProjects} onImported={handleImported} />

            <Link to={`${ROUTES.PROJECT_CREATE}?type=portfolio`}>
              <Button className="flex items-center gap-2 bg-black hover:bg-slate-800 text-white dark:bg-white dark:text-black dark:hover:bg-slate-200">
                <Plus size={18} />
                <span>Create Project</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-16 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400 mb-3" />
          <p className="text-base font-medium text-slate-600 dark:text-slate-300">
            Loading master portfolios...
          </p>
        </div>
      ) : portfolios.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-16 text-center">
          <Layers className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">No Portfolios Found</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Create your first Master Project / Portfolio Tour to start organizing projects into structured portfolios.
          </p>
          <Link to={ROUTES.PROJECT_CREATE} className="mt-6 inline-block">
            <Button>Create Master Portfolio</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {portfolios.map((portfolio) => {
            const stats = portfolioStats[portfolio._id] || { count: 0, types: [], categories: [], publishedCount: 0, draftCount: 0 };

            return (() => {
              const thumbUrl = portfolio.media?.thumbnailImage?.url
                || portfolio.media?.coverImage?.url
                || null;
              // Only show logo if there's a dedicated logo image, not the same as the thumbnail
              const logoUrl = portfolio.media?.logoImage?.url
                || (portfolio.media?.coverImage?.url && portfolio.media?.thumbnailImage?.url
                    ? portfolio.media.coverImage.url
                    : null);
              const resolvedThumb = thumbUrl ? getImageUrl(thumbUrl) : null;
              const resolvedLogo = logoUrl && logoUrl !== thumbUrl ? getImageUrl(logoUrl) : null;

              return (
                <Card
                  key={portfolio._id}
                  className="group relative overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 hover:shadow-xl hover:border-slate-400 dark:hover:border-slate-600 flex flex-col justify-between pt-0 py-0 gap-0"
                >
                  {/* Thumbnail Banner */}
                  <div
                    className="relative w-full overflow-hidden"
                    style={{ height: "180px" }}
                  >
                    {resolvedThumb ? (
                      <img
                        src={resolvedThumb}
                        alt={portfolio.general?.projectName || "Portfolio"}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-900/80 via-slate-800 to-slate-900 flex items-center justify-center">
                        <FolderKanban className="h-14 w-14 text-white/20" />
                      </div>
                    )}

                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Project count badge — top-left */}
                    <span className="absolute top-3 left-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow">
                      {stats.count} {stats.count === 1 ? "Project" : "Projects"}
                    </span>

                    {/* Export ZIP icon — top-right */}
                    <ExportPortfolioZipButton
                      portfolio={portfolio}
                      childProjects={allProjects.filter(
                        (p) =>
                          String(p.parentProject) === String(portfolio._id) ||
                          String(p.parentProject?._id) === String(portfolio._id)
                      )}
                    />

                    {/* Logo overlay (bottom-left) */}
                    {resolvedLogo && (
                      <div className="absolute bottom-3 left-3">
                        <img
                          src={resolvedLogo}
                          alt="Logo"
                          className="h-9 w-9 rounded-full object-cover border-2 border-white/60 shadow-md bg-white"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      </div>
                    )}

                    {/* Project name overlay */}
                    <div className="absolute bottom-3 right-3" style={{ left: resolvedLogo ? "52px" : "12px" }}>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-white font-bold text-base leading-tight line-clamp-2 drop-shadow">
                          {portfolio.general?.projectName || "Untitled Portfolio"}
                        </h3>
                        <DeletePortfolioButton portfolio={portfolio} />
                      </div>
                      {(portfolio.general?.builderName || portfolio.general?.projectName) && (
                        <p className="text-white/70 text-xs mt-0.5 flex items-center gap-1">
                          <Building2 className="h-3 w-3 shrink-0" />
                          <span className="truncate">{portfolio.general?.builderName || portfolio.general?.projectName}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <CardContent className="p-4 space-y-3">
                    {portfolio.general?.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {portfolio.general.description}
                      </p>
                    )}

                    {/* Status & Date Bar */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{stats.publishedCount} Published</span>
                        </span>
                        {stats.draftCount > 0 && (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{stats.draftCount} Draft</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {new Date(portfolio.updatedAt || portfolio.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => navigate(ROUTES.PROJECTS_PORTFOLIO_DETAIL.replace(":portfolioId", portfolio._id))}
                        className="w-full flex items-center justify-center gap-1 text-xs font-semibold cursor-pointer"
                        variant="outline"
                      >
                        <span>View</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        onClick={() => navigate(ROUTES.PROJECT_MAP_PREVIEW.replace(":id", portfolio._id), { state: { from: ROUTES.PROJECTS_MASTER } })}
                        className="w-full flex items-center justify-center gap-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-sm px-2"
                      >
                        <Map className="h-3.5 w-3.5" />
                        <span>Gallery</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })();
          })}
        </div>
      )}
    </div>
  );
};

export default MasterProjects;
