import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import dashboardService from "@/services/dashboard/dashboardService";

import StatsCard from "@/components/dashboard/StatsCard";
import ProjectOverviewToolbar from "@/components/dashboard/ProjectOverviewToolbar";
import ProjectOverviewTable from "@/components/dashboard/ProjectOverviewTable";

const Dashboard = () => {
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    featured: "",
    sort: "newest",
    page: 1,
  });

  const {
    data: statsResponse,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardService.getStats,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const {
    data: overviewResponse,
    isLoading: overviewLoading,
    isError: overviewError,
  } = useQuery({
    queryKey: ["project-overview", filters],
    queryFn: () =>
      dashboardService.getProjectOverview(filters),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handleReset = () => {
    setFilters({
      search: "",
      status: "",
      featured: "",
      sort: "newest",
      page: 1,
    });
  };

  if (statsLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-medium text-slate-600 dark:text-slate-300">Loading dashboard...</h2>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-12 text-center dark:border-red-900/50 dark:bg-red-950/40">
        <h2 className="text-base font-medium text-red-600 dark:text-red-400">Failed to load dashboard.</h2>
      </div>
    );
  }

  const stats = statsResponse?.data || {};

  const projects =
    overviewResponse?.data?.items ?? [];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
        Dashboard
      </h1>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Projects"
          value={stats.totalProjects ?? 0}
        />

        <StatsCard
          title="Published"
          value={stats.publishedProjects ?? 0}
        />

        <StatsCard
          title="Draft"
          value={stats.draftProjects ?? 0}
        />

        <StatsCard
          title="Featured"
          value={stats.featuredProjects ?? 0}
        />
      </div>

      <ProjectOverviewToolbar
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleReset}
      />

      <ProjectOverviewTable
        projects={projects}
        isLoading={overviewLoading}
        isError={overviewError}
      />
    </div>
  );
};

export default Dashboard;