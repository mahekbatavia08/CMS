/**
 * ==========================================================================
 * ONE-TIME migration: MongoDB (+ Cloudinary + local /uploads) -> Supabase
 * ==========================================================================
 *
 * Copies admins, filter values and projects from MongoDB into Supabase,
 * keeping the SAME ids (24-char hex), timestamps and password hashes.
 * Every media URL inside a project is moved to Supabase Storage:
 *   - https://res.cloudinary.com/...      -> downloaded + re-uploaded
 *   - uploads/... | /uploads/... | /projects/...  (local files) -> uploaded
 *     (floor plan folders are uploaded whole, incl. DZI tiles)
 * and the project is saved with the new public URLs.
 *
 * Usage (from /server):
 *   npm install --no-save mongodb        # temporary, not added to package.json
 *   node scripts/migrateMongoToSupabase.js            # data + media
 *   node scripts/migrateMongoToSupabase.js --skip-media   # data only (keep old URLs)
 *
 * Needs in .env: MONGODB_URI, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Optional:      LEGACY_UPLOADS_DIR (default: ./uploads), MONGO_DNS_OVERRIDE=true
 *
 * Re-runnable: rows are upserted by id; already-moved files are cached in
 * scripts/.media-map.json and skipped on the next run.
 */
import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import dns from "node:dns";

import supabase, { unwrap } from "../config/supabase.js";
import { projectSchema, sanitizeProject, toRow } from "../models/Project.js";
import { uploadBuffer, uploadDirectory, getPublicUrl, guessContentType } from "../utils/storage.js";

const SKIP_MEDIA = process.argv.includes("--skip-media");
const UPLOADS_DIR = path.resolve(process.env.LEGACY_UPLOADS_DIR || path.join(process.cwd(), "uploads"));
const MAP_FILE = path.join(process.cwd(), "scripts", ".media-map.json");
const BATCH = 200;

let mongodb;
try {
    mongodb = await import("mongodb");
} catch {
    console.error('Missing "mongodb" driver. Run: npm install --no-save mongodb');
    process.exit(1);
}

/* ------------------------------ helpers ------------------------------ */

const mediaMap = fs.existsSync(MAP_FILE) ? JSON.parse(fs.readFileSync(MAP_FILE, "utf8")) : {};
const saveMap = () => fs.writeFileSync(MAP_FILE, JSON.stringify(mediaMap, null, 2));
const uploadedDirs = new Set();
const stats = { cloudinary: 0, local: 0, missing: 0, failed: 0 };

const iso = (d) => (d ? new Date(d).toISOString() : new Date().toISOString());
const hex = (id) => (id ? String(id).toLowerCase() : null);

/** Converts BSON types (ObjectId, Date, Decimal128...) into plain JSON. */
const toPlain = (doc) => JSON.parse(JSON.stringify(doc));

const CLOUDINARY_RE = /^https?:\/\/res\.cloudinary\.com\//i;

const cloudinaryKey = (url) => {
    const after = url.split("/upload/")[1] || url.replace(CLOUDINARY_RE, "");
    const parts = after.split("?")[0].split("/");
    if (/^v\d+$/.test(parts[0])) parts.shift();
    return `migrated/cloudinary/${parts.map(decodeURIComponent).join("/")}`;
};

/** Maps a legacy local path string to a file under UPLOADS_DIR (or null). */
const localFileFor = (value) => {
    let rel = value.replace(/\\/g, "/").split("?")[0].replace(/^\/+/, "");
    if (rel.startsWith("uploads/")) rel = rel.slice("uploads/".length);
    else if (!rel.startsWith("projects/") && !rel.startsWith("floorplans/")) return null;
    const full = path.join(UPLOADS_DIR, rel);
    if (!full.startsWith(UPLOADS_DIR)) return null;
    try {
        if (fs.statSync(full).isFile()) return { full, rel };
    } catch {
        /* not found */
    }
    return null;
};

const migrateUrl = async (value) => {
    if (typeof value !== "string" || !value.trim()) return value;
    const v = value.trim();
    if (mediaMap[v]) return mediaMap[v];

    // 1) Cloudinary
    if (CLOUDINARY_RE.test(v)) {
        try {
            const res = await fetch(v);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const buffer = Buffer.from(await res.arrayBuffer());
            const key = cloudinaryKey(v);
            const type = res.headers.get("content-type") || guessContentType(key);
            mediaMap[v] = await uploadBuffer(key, buffer, type);
            stats.cloudinary++;
            saveMap();
            return mediaMap[v];
        } catch (err) {
            console.warn(`  ! Cloudinary download failed (${err.message}): ${v}`);
            stats.failed++;
            return value;
        }
    }

    // 2) Local uploads (served before by express.static)
    if (/^https?:|^data:|^blob:/i.test(v)) return value;
    const local = localFileFor(v);
    if (!local) {
        if (/^\/?(uploads|projects|floorplans)\//.test(v)) {
            console.warn(`  ! Local file not found: ${v}`);
            stats.missing++;
        }
        return value;
    }

    try {
        const relDir = path.posix.dirname(local.rel);
        if (local.rel.startsWith("floorplans/") || local.rel.includes("/floorplans/")) {
            // Floor plan: upload the whole folder once (original, thumbnail, DZI tiles)
            if (!uploadedDirs.has(relDir)) {
                await uploadDirectory(path.dirname(local.full), `migrated/local/${relDir}`);
                uploadedDirs.add(relDir);
            }
            mediaMap[v] = getPublicUrl(`migrated/local/${local.rel}`);
        } else {
            const buffer = await fsp.readFile(local.full);
            mediaMap[v] = await uploadBuffer(`migrated/local/${local.rel}`, buffer, guessContentType(local.full));
        }
        stats.local++;
        saveMap();
        return mediaMap[v];
    } catch (err) {
        console.warn(`  ! Local upload failed (${err.message}): ${v}`);
        stats.failed++;
        return value;
    }
};

/** Deep-walks a value, migrating every string that is a media URL/path. */
const migrateDeep = async (value) => {
    if (typeof value === "string") return migrateUrl(value);
    if (Array.isArray(value)) {
        const out = [];
        for (const item of value) out.push(await migrateDeep(item));
        return out;
    }
    if (value && typeof value === "object") {
        const out = {};
        for (const [k, v] of Object.entries(value)) out[k] = await migrateDeep(v);
        return out;
    }
    return value;
};

/** Same legacy auto-repair the old config/db.js ran on startup. */
const repairLegacy = (doc, i) => {
    const needsRepair =
        typeof doc.status === "string" || doc.status == null || doc.projectTag === undefined || doc.general === undefined;
    if (!needsRepair) return doc;

    const rawStr = String(doc.status || "").trim().toLowerCase();
    const isPub = rawStr === "active" || rawStr === "published";
    const statusVal = isPub ? "Published" : rawStr === "archived" ? "Archived" : "Draft";
    const gen = doc.general || {};
    const name = gen.projectName || doc.projectName || `Project ${i + 1}`;
    const builder = gen.builderName || doc.builderName || "Pramukh Group";
    const slug =
        gen.slug || doc.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `project-${i + 1}`;

    return {
        ...doc,
        status: { status: statusVal, published: isPub, featured: false, isDeleted: false },
        general: { projectName: name, builderName: builder, slug: `${slug}-${String(doc._id).slice(-4)}` },
        projectTag: doc.projectTag || `P${Date.now()}-${String(doc._id).slice(-4)}`,
    };
};

const upsertOn = (table, rows, onConflict) => upsert(table, rows, onConflict);

const upsert = async (table, rows, onConflict = "id") => {
    for (let i = 0; i < rows.length; i += BATCH) {
        unwrap(await supabase.from(table).upsert(rows.slice(i, i + BATCH), { onConflict }));
    }
};

/* ------------------------------- main -------------------------------- */

const main = async () => {
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set in .env");
    if (process.env.MONGO_DNS_OVERRIDE === "true") dns.setServers(["8.8.8.8", "1.1.1.1"]);

    const client = new mongodb.MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    console.log(`Connected to MongoDB database "${db.databaseName}"`);

    /* ---- admins ---- */
    const admins = (await db.collection("admins").find({}).toArray()).map(toPlain);
    await upsertOn(
        "admins",
        admins.map((a) => ({
            id: hex(a._id),
            name: String(a.name || "").trim() || "Admin",
            email: String(a.email || "").toLowerCase().trim(),
            password: a.password,
            is_active: a.isActive !== false,
            created_at: iso(a.createdAt),
            updated_at: iso(a.updatedAt),
        })),
        "email",
    );
    console.log(`✔ admins: ${admins.length}`);

    /* ---- filter values ---- */
    const filterValues = (await db.collection("filtervalues").find({}).toArray()).map(toPlain);
    const seenFv = new Set();
    const fvRows = [];
    for (const f of filterValues) {
        const key = `${f.type}\u0000${f.value}`;
        if (!f.type || !f.value || seenFv.has(key)) continue;
        seenFv.add(key);
        fvRows.push({
            id: hex(f._id),
            type: f.type,
            value: f.value,
            usage_count: Math.max(1, Number(f.usageCount) || 1),
            created_at: iso(f.createdAt),
            updated_at: iso(f.updatedAt),
        });
    }
    await upsert("filter_values", fvRows, "type,value");
    console.log(`✔ filter_values: ${fvRows.length}`);

    /* ---- projects ---- */
    const rawProjects = (await db.collection("projects").find({}).sort({ _id: 1 }).toArray()).map(toPlain);
    const knownKeys = new Set([...Object.keys(projectSchema), "_id", "__v", "createdAt", "updatedAt"]);
    const usedSlugs = new Set();
    const usedTags = new Set();
    const ids = new Set(rawProjects.map((p) => hex(p._id)));
    const rows = [];
    const parents = [];

    // Target must be empty (or contain only rows from a previous run of this script)
    const existing = unwrap(await supabase.from("projects").select("id").limit(5000));
    const foreign = existing.filter((r) => !ids.has(r.id));
    if (foreign.length && !process.argv.includes("--force")) {
        throw new Error(
            `Supabase "projects" already has ${foreign.length} rows that are not from MongoDB. ` +
            "Migrate into an empty table (truncate it first) or pass --force.",
        );
    }

    for (let i = 0; i < rawProjects.length; i++) {
        let doc = repairLegacy(rawProjects[i], i);
        const id = hex(doc._id);
        console.log(`→ [${i + 1}/${rawProjects.length}] ${doc.general?.projectName || id}`);

        if (!SKIP_MEDIA) doc = await migrateDeep(doc);

        // unknown top-level fields are preserved in `legacy`
        const legacy = {};
        for (const [k, v] of Object.entries(doc)) if (!knownKeys.has(k)) legacy[k] = v;

        let clean;
        try {
            clean = sanitizeProject(doc);
        } catch (err) {
            console.warn(`  ! ${err.message} — stored without strict validation`);
            clean = sanitizeProject(doc, { validate: false });
        }

        // uniqueness (slug / projectTag)
        let slug = clean.general.slug;
        if (usedSlugs.has(slug)) slug = `${slug}-${id.slice(-4)}`;
        usedSlugs.add(slug);
        clean.general.slug = slug;
        let tag = clean.projectTag;
        if (usedTags.has(tag)) tag = `${tag}-${id.slice(-4)}`;
        usedTags.add(tag);
        clean.projectTag = tag;

        let parent = clean.parentProject;
        if (parent && (!ids.has(parent) || parent === id)) {
            console.warn(`  ! parentProject ${parent} does not exist — set to null`);
            parent = null;
        }
        if (parent) parents.push(id);

        rows.push({
            id,
            ...toRow({ ...clean, parentProject: parent }),
            legacy,
            created_at: iso(doc.createdAt),
            updated_at: iso(doc.updatedAt),
        });
    }

    // Parents first so every parent_project reference already exists.
    const byId = new Map(rows.map((r) => [r.id, r]));
    const ordered = [];
    const visited = new Set();
    const visit = (row, trail = new Set()) => {
        if (visited.has(row.id)) return;
        if (trail.has(row.id)) {
            console.warn(`  ! parent cycle at ${row.id} — parent set to null`);
            row.parent_project = null;
        }
        trail.add(row.id);
        if (row.parent_project && byId.has(row.parent_project)) visit(byId.get(row.parent_project), trail);
        visited.add(row.id);
        ordered.push(row);
    };
    rows.forEach((r) => visit(r));

    await upsert("projects", ordered);
    console.log(`✔ projects: ${rows.length} (with parent: ${parents.length})`);

    if (!SKIP_MEDIA) {
        console.log(
            `✔ media: ${stats.cloudinary} from Cloudinary, ${stats.local} local files, ` +
            `${stats.missing} missing, ${stats.failed} failed`,
        );
    }

    await client.close();
    console.log("Migration complete.");
};

main().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});