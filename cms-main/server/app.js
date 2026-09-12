import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import path from "path";
import { fileURLToPath } from "url";

import routes from "./routes/index.js";
import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const normalizeOrigin = (value) => value?.replace(/\/$/, "");
const allowedOrigins = new Set(
  [
    normalizeOrigin(process.env.CLIENT_URL),
    "https://cms-frontnd.onrender.com",
    "http://localhost:5173",
    "http://localhost:3000",
  ].filter(Boolean),
);

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests or same-origin tools without an Origin header.
      if (!origin || allowedOrigins.has(normalizeOrigin(origin))) {
        return callback(null, true);
      }

      // Allow any localhost port in development to prevent issues when Vite switches ports (e.g., 5174)
      if (origin.startsWith("http://localhost:")) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(
  "/projects",
  express.static(path.join(process.cwd(), "uploads", "projects")),
);
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads")),
);


app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
