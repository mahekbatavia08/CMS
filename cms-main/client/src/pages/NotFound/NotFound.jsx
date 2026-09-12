import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5">
      <h1 className="text-7xl font-bold">404</h1>

      <p className="text-slate-500">
        Page not found.
      </p>

      <Link
        to="/dashboard"
        className="rounded-lg bg-black px-5 py-2 text-white"
      >
        Back to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;