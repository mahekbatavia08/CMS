import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Layers, 
  FileText,
  Map, 
  X 
} from "lucide-react";

import { ROUTES } from "@/constants/routes";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const pathname = location.pathname;

  const isMapSkinPage = pathname.includes("/map-skin");
  const isDashboardActive = pathname === ROUTES.DASHBOARD;
  const isMasterProjectsActive = pathname === ROUTES.PROJECTS_MASTER || pathname.startsWith("/projects/master");
  const isIndividualProjectsActive = (pathname === ROUTES.PROJECTS_INDIVIDUAL || pathname === ROUTES.PROJECTS) && !isMapSkinPage;

  const projectMatch = pathname.match(/\/projects\/([^/]+)/);
  const currentProjectId =
    projectMatch && !["new", "master", "individual"].includes(projectMatch[1])
      ? projectMatch[1]
      : null;

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen w-64 border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out dark:border-slate-800 dark:bg-slate-950 lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex h-full flex-col justify-between p-4">
        {/* Top Section */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Portfolio CMS
            </h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
            >
              <X size={20} />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            <NavLink
              to={ROUTES.DASHBOARD}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
                isDashboardActive
                  ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
              }`}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to={ROUTES.PROJECTS_MASTER}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
                isMasterProjectsActive
                  ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
              }`}
            >
              <Layers size={18} />
              <span>Master Project</span>
            </NavLink>

            <NavLink
              to={ROUTES.PROJECTS_INDIVIDUAL}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
                isIndividualProjectsActive
                  ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
              }`}
            >
              <FileText size={18} />
              <span>Individual</span>
            </NavLink>

            {/* Select Map Skin Contextual Item */}
            {(isMapSkinPage || currentProjectId) && (
              <NavLink
                to={
                  currentProjectId
                    ? ROUTES.PROJECT_MAP_SKIN.replace(":id", currentProjectId)
                    : ROUTES.PROJECTS_INDIVIDUAL
                }
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
                  isMapSkinPage
                    ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                }`}
              >
                <Map size={18} />
                <span>Select Map Skin</span>
              </NavLink>
            )}
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
