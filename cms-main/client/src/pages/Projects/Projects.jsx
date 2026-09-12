import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import projectService from "@/services/project/projectService";

import ProjectTable from "@/components/project/ProjectTable";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { ROUTES } from "@/constants/routes";

const Projects = () => {
    const location = useLocation();
    const isIndividualRoute =
        location.pathname === ROUTES.PROJECTS_INDIVIDUAL ||
        location.pathname === ROUTES.PROJECTS;

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [featured, setFeatured] = useState("all");
    const [sort, setSort] = useState("newest");

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [projectCategory, setProjectCategory] = useState("individual");

    useEffect(() => {
        setProjectCategory("individual");
    }, [isIndividualRoute]);

    useEffect(() => {
        setPage(1);
    }, [
        search,
        status,
        featured,
        sort,
        projectCategory,
    ]);

    const { data, isLoading, isError } = useQuery({
        queryKey: [
            "projects",
            search,
            status,
            featured,
            projectCategory,
            sort,
            page,
            limit,
            isIndividualRoute,
        ],
        queryFn: () =>
            projectService.getProjects({
                page,
                limit,
                search,
                status:
                    status === "all"
                        ? undefined
                        : status,
                featured:
                    featured === "all"
                        ? undefined
                        : featured === "featured",
                projectCategory:
                    projectCategory === "all"
                        ? undefined
                        : projectCategory,
                sort,
            }),
    });

    const projects = data?.data?.items || data?.items || [];
    const totalItems = data?.data?.totalItems || data?.totalItems || 0;
    const totalPages = data?.data?.totalPages || data?.totalPages || 1;
    const currentPage = data?.data?.currentPage || data?.currentPage || page;

    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
    const endItem = Math.min(currentPage * limit, totalItems);

    return (
        <div className="space-y-8 pb-12">
            <div>
                <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                    <Link to={ROUTES.PROJECTS} className="hover:text-slate-900 dark:hover:text-slate-100 transition">
                        Projects
                    </Link>
                    {isIndividualRoute && (
                        <>
                            <span>/</span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">Individual Project</span>
                        </>
                    )}
                </nav>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold dark:text-slate-50">
                            {isIndividualRoute ? "Individual Projects" : "Projects"}
                        </h1>

                        <p className="mt-1 text-slate-500 dark:text-slate-400">
                            {isIndividualRoute
                                ? "Manage standalone individual projects."
                                : "Manage all projects and portfolio tours."}
                        </p>
                    </div>

                    <Link to={`${ROUTES.PROJECT_CREATE}?type=individual`}>
                        <Button className="flex items-center gap-2 bg-black hover:bg-slate-800 text-white dark:bg-white dark:text-black dark:hover:bg-slate-200">
                            <Plus size={18} />
                            <span>Create Project</span>
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm transition-colors">
                <div className="relative flex-1 min-w-[200px]">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by project or builder..."
                        className="pl-10 w-full"
                    />
                </div>

                <Select
                    value={status}
                    onValueChange={setStatus}
                >
                    <SelectTrigger className="w-full md:w-44">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="all">
                            All Statuses
                        </SelectItem>

                        <SelectItem value="Draft">
                            Draft
                        </SelectItem>

                        <SelectItem value="Published">
                            Published
                        </SelectItem>

                        <SelectItem value="Archived">
                            Archived
                        </SelectItem>
                    </SelectContent>
                </Select>

                {!isIndividualRoute && (
                    <Select
                        value={projectCategory}
                        onValueChange={setProjectCategory}
                    >
                        <SelectTrigger className="w-full md:w-52">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="all">
                                All Categories
                            </SelectItem>

                            <SelectItem value="portfolio">
                                Portfolio Tours
                            </SelectItem>

                            <SelectItem value="individual">
                                Individual Projects
                            </SelectItem>
                        </SelectContent>
                    </Select>
                )}

                <Select
                    value={featured}
                    onValueChange={setFeatured}
                >
                    <SelectTrigger className="w-full md:w-44">
                        <SelectValue placeholder="Featured" />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="all">
                            All Projects
                        </SelectItem>

                        <SelectItem value="featured">
                            Featured
                        </SelectItem>

                        <SelectItem value="not-featured">
                            Not Featured
                        </SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={sort}
                    onValueChange={setSort}
                >
                    <SelectTrigger className="w-full md:w-52">
                        <SelectValue placeholder="Sort By" />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="newest">
                            Newest First
                        </SelectItem>

                        <SelectItem value="oldest">
                            Oldest First
                        </SelectItem>

                        <SelectItem value="name-asc">
                            Project Name (A-Z)
                        </SelectItem>

                        <SelectItem value="name-desc">
                            Project Name (Z-A)
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-16 text-center text-slate-700 dark:text-slate-300">
                    <h2 className="text-xl font-medium">
                        Loading projects...
                    </h2>
                </div>
            ) : isError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40 p-16 text-center text-red-600 dark:text-red-400">
                    <h2 className="text-xl font-medium">
                        Failed to load projects.
                    </h2>
                </div>
            ) : projects.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-16 text-center">
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                        No Projects Found
                    </h2>

                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                        Try changing your filters or create a new project.
                    </p>

                    <Link
                        to={`${ROUTES.PROJECT_CREATE}?type=individual`}
                        className="mt-6 inline-block"
                    >
                        <Button>
                            Create Project
                        </Button>
                    </Link>
                </div>
            ) : (
                <>
                    <ProjectTable projects={projects} />

                    <div className="mt-6 flex flex-col md:flex-row items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 gap-4 shadow-sm transition-colors">
                        <div className="text-sm text-slate-600 dark:text-slate-300 text-center md:text-left">
                            Showing <strong className="font-semibold text-slate-900 dark:text-slate-100">{startItem}</strong> -{" "}
                            <strong className="font-semibold text-slate-900 dark:text-slate-100">{endItem}</strong> of{" "}
                            <strong className="font-semibold text-slate-900 dark:text-slate-100">{totalItems}</strong> projects
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <Select
                                value={String(limit)}
                                onValueChange={(value) => {
                                    setLimit(Number(value));
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="w-24 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                                    <SelectValue />
                                </SelectTrigger>

                                <SelectContent className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                                    <SelectItem value="10">
                                        10
                                    </SelectItem>

                                    <SelectItem value="25">
                                        25
                                    </SelectItem>

                                    <SelectItem value="50">
                                        50
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                disabled={currentPage === 1}
                                onClick={() => setPage((prev) => prev - 1)}
                            >
                                Previous
                            </Button>

                            <span className="text-sm font-medium whitespace-nowrap text-slate-700 dark:text-slate-300">
                                Page {currentPage} of {totalPages}
                            </span>

                            <Button
                                variant="outline"
                                className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                disabled={currentPage === totalPages}
                                onClick={() => setPage((prev) => prev + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Projects;
