import useAuth from "@/hooks/useAuth";
import { Menu } from "lucide-react";

import { ModeToggle } from "@/components/mode-toggle";

const Navbar = ({ toggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="flex h-8 items-center justify-between bg-slate-100 dark:bg-slate-950 px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden p-1 -ml-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          onClick={toggleSidebar}
        >
          <Menu size={24} />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <ModeToggle />
        <div className="text-sm text-slate-600 dark:text-slate-300 hidden sm:block">
          {user?.name || "Administrator"}
        </div>
      </div>
    </header>
  );
};

export default Navbar;