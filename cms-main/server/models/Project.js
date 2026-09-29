import supabase, { unwrap } from "../config/supabase.js";
import { newObjectId, isValidObjectId } from "../utils/objectId.js";

/**
 * ==========================================
 * Project model (Supabase / Postgres)
 * ==========================================
 * Data lives in the `projects` table: one JSONB column per nested
 * sub-document (general, contact, media, ...). This file replaces the
 * Mongoose schema: it applies the same defaults, trimming, casting,
 * enums, required checks and the same pre("validate") normalization,
 * and converts rows <-> the exact JSON shape the API always returned
 * (`_id`, camelCase keys, `createdAt`, `updatedAt`).
 */

const TABLE = "projects";

/* ------------------------------------------------------------------ */
/* Schema description (mirrors the old Mongoose schema 1:1)           */
/* ------------------------------------------------------------------ */

const str = (o = {}) => ({ kind: "str", ...o });
const num = (o = {}) => ({ kind: "num", ...o });
const bool = (o = {}) => ({ kind: "bool", ...o });
const mixed = (o = {}) => ({ kind: "mixed", ...o });
const arr = (of, o = {}) => ({ kind: "arr", of, default: () => [], ...o });
// sub = sub-schema (always materialised when a default is given)
const sub = (props, o = {}) => ({ kind: "obj", props, ...o });
// nested = plain nested path (only present when it has a value)
const nested = (props, o = {}) => ({ kind: "obj", props, nested: true, ...o });

const T = { trim: true };

const galleryItem = sub({
  url: str(T),
  alt: str(T),
  caption: str(T),
  displayOrder: num({ default: 0 }),
});

const galleryAlbum = sub({
  albumName: str({ ...T, required: true }),
  displayOrder: num({ default: 0 }),
  images: arr(galleryItem),
});

const videoItem = sub({
  title: str(T),
  url: str(T),
  thumbnail: str(T),
  type: str(T),
  displayOrder: num({ default: 0 }),
});

const floorPlanPage = sub({
  pageNumber: num({ required: true }),
  dziPath: str({ ...T, default: "" }),
  url: str({ ...T, default: "" }),
});

const floorPlanItem = sub(
  {
    title: str({ ...T, required: true }),
    originalPdf: str({ ...T, required: true }),
    thumbnail: str(T),
    pageCount: num(),
    pages: arr(floorPlanPage),
    displayOrder: num({ default: 0 }),
  },
  { withId: true },
);

const documentItem = sub({ title: str(T), url: str(T) }, { timestamps: true });

const general = sub({
  projectName: str({ ...T, required: true, message: "Project name is required" }),
  builderName: str({ ...T, required: true, message: "Builder name is required" }),
  slug: str({ ...T, lowercase: true, required: true, message: "Slug is required" }),
  projectType: str(),
  tagline: str(T),
  description: str(T),
  area: mixed(),
  category: mixed({ default: () => [] }),
  propertyType: mixed({ default: () => [] }),
  possessionStatus: str(T),
  city: str(T),
});

const contact = sub({
  phone: str(T),
  whatsapp: str(T),
  email: str({ ...T, lowercase: true }),
  website: str(T),
  facebook: str(T),
  instagram: str(T),
  linkedin: str(T),
  youtube: str(T),
});

const location = sub({
  address: str(T),
  city: str(T),
  state: str(T),
  pincode: str(T),
  googleMaps: str(T),
  mapEmbedUrl: str(T),
});

const specificationItem = sub({
  title: str(T),
  description: str(T),
  icon: str({ ...T, default: "" }),
});

const specificationSection = sub({
  primaryTitle: str({ ...T, default: "" }),
  items: arr(specificationItem),
});

const filters = sub({
  category: mixed({ default: () => [] }),
  propertyType: mixed({ default: () => [] }),
  possessionStatus: str(T),
  city: str(T),
  area: mixed({ default: () => [] }),
  squareFoot: str(T),
  amenities: arr(str()),
  tags: arr(str()),
});

const rera = sub({
  number: str(T),
  certificate: nested({ url: str(T), name: str(T) }),
});

const media = sub({
  coverImage: nested({ url: str(T), alt: str(T) }),
  thumbnailImage: nested({ url: str(T), alt: str(T) }),
  logoImage: nested({ url: str(T), alt: str(T) }),
  gallery: arr(galleryAlbum),
});

const seo = sub({
  metaTitle: str(T),
  metaDescription: str(T),
  shareDescription: str(T),
  keywords: mixed(),
  canonicalUrl: str(T),
});

const status = sub({
  featured: bool({ default: false }),
  published: bool({ default: false }),
  status: str({ enum: ["Draft", "Published", "Archived"], default: "Draft" }),
  isDeleted: bool({ default: false }),
});

const skinSettings = sub({
  dayNightToggle: bool({ default: false }),
  currentFutureToggle: bool({ default: false }),
  amenity: bool({ default: false }),
  floorplan: bool({ default: false }),
  locality: bool({ default: false }),
  connectivity: bool({ default: false }),
  contact: bool({ default: true }),
  location: bool({ default: true }),
  brochure: bool({ default: true }),
  legal: bool({ default: true }),
  photos: bool({ default: true }),
  videos: bool({ default: true }),
  floorplans: bool({ default: true }),
  share: bool({ default: true }),
  whatsapp: bool({ default: true }),
  vr: bool({ default: true }),
  sound: bool({ default: true }),
  autoRotate: bool({ default: true }),
  fullscreen: bool({ default: true }),
  aboutUs: bool({ default: true }),
  rera: bool({ default: false }),
});

const OBJ = () => ({});

const projectSchema = {
  general: { ...general, required: true },
  projectTag: str({ required: true }),
  projectCategory: str({ enum: ["portfolio", "individual"], default: "individual", required: true }),
  parentProject: { kind: "id", default: null },
  alsoShowAsIndividual: bool({ default: false }),
  contact: { ...contact, default: OBJ },
  location: { ...location, default: OBJ },
  specifications: arr(specificationSection),
  filters: { ...filters, default: OBJ },
  rera: { ...rera, default: OBJ },
  media: { ...media, default: OBJ },
  videos: arr(videoItem),
  brochures: arr(documentItem),
  legalDocuments: arr(documentItem),
  floorPlans: arr(floorPlanItem),
  seo: { ...seo, default: OBJ },
  status: { ...status, default: OBJ },
  mapSkin: str({ ...T, default: "default" }),
  skinSettings: { ...skinSettings, default: OBJ },
};

/* ------------------------------------------------------------------ */
/* Casting / validation (Mongoose-equivalent)                         */
/* ------------------------------------------------------------------ */

const validationError = (message) => {
  const err = new Error(`Project validation failed: ${message}`);
  err.name = "ValidationError";
  return err;
};

const castError = (type, value, path) =>
  validationError(`${path}: Cast to ${type} failed for value "${value}"`);

const resolveDefault = (spec) =>
  typeof spec.default === "function" ? spec.default() : spec.default;

const TRUE_VALUES = new Set([true, "true", 1, "1", "yes"]);
const FALSE_VALUES = new Set([false, "false", 0, "0", "no"]);

const castValue = (spec, value, path, now) => {
  if (value === undefined) {
    const d = resolveDefault(spec);
    if (d === undefined) return undefined;
    return spec.kind === "obj" || spec.kind === "arr" ? castValue(spec, d, path, now) : d;
  }

  switch (spec.kind) {
    case "mixed":
      return value;

    case "id": {
      if (value === null || value === "") return null;
      const id = typeof value === "object" ? String(value._id || value.$oid || "") : String(value);
      if (!isValidObjectId(id)) throw castError("ObjectId", value, path);
      return id.toLowerCase();
    }

    case "str": {
      if (value === null) return null;
      if (typeof value === "object") throw castError("string", JSON.stringify(value), path);
      let s = String(value);
      if (spec.trim) s = s.trim();
      if (spec.lowercase) s = s.toLowerCase();
      return s;
    }

    case "num": {
      if (value === null || value === "") return null;
      const n = Number(value);
      if (Number.isNaN(n)) throw castError("Number", value, path);
      return n;
    }

    case "bool": {
      if (value === null) return null;
      if (TRUE_VALUES.has(value)) return true;
      if (FALSE_VALUES.has(value)) return false;
      throw castError("Boolean", value, path);
    }

    case "arr": {
      if (value === null) return castValue(spec, undefined, path, now);
      const list = Array.isArray(value) ? value : [value];
      return list
        .map((item, i) => castValue({ ...spec.of, default: undefined }, item, `${path}.${i}`, now))
        .filter((item) => item !== undefined);
    }

    case "obj": {
      if (value === null) return spec.default ? castValue(spec, undefined, path, now) : null;
      if (typeof value !== "object" || Array.isArray(value)) {
        throw castError("Embedded", JSON.stringify(value), path);
      }
      const out = {};
      if (spec.withId) {
        const id = value._id ? String(value._id.$oid || value._id) : newObjectId();
        out._id = isValidObjectId(id) ? id.toLowerCase() : newObjectId();
      }
      let hasValue = false;
      for (const [key, childSpec] of Object.entries(spec.props)) {
        const childPath = path ? `${path}.${key}` : key;
        const v = castValue(childSpec, value[key], childPath, now);
        if (v !== undefined) {
          out[key] = v;
          if (value[key] !== undefined) hasValue = true;
        }
      }
      if (spec.timestamps) {
        out.createdAt = value.createdAt || now;
        out.updatedAt = value.updatedAt || now;
      }
      // Plain nested paths are omitted when nothing was set (Mongoose minimize)
      if (spec.nested && !hasValue) return undefined;
      return out;
    }

    default:
      return value;
  }
};

const validateValue = (spec, value, path) => {
  const label = path.split(".").pop();
  const isEmpty = value === undefined || value === null || value === "";

  if (spec.required && isEmpty) {
    throw validationError(`${path}: ${spec.message || `Path \`${label}\` is required.`}`);
  }
  if (spec.enum && !isEmpty && !spec.enum.includes(value)) {
    throw validationError(`${path}: \`${value}\` is not a valid enum value for path \`${label}\`.`);
  }
  if (spec.kind === "arr" && Array.isArray(value)) {
    value.forEach((item, i) => validateValue(spec.of, item, `${path}.${i}`));
  }
  if (spec.kind === "obj" && value && typeof value === "object") {
    for (const [key, childSpec] of Object.entries(spec.props)) {
      validateValue(childSpec, value[key], `${path}.${key}`);
    }
  }
};

/**
 * Same logic as the old projectSchema.pre("validate") hook.
 */
const preValidate = (doc) => {
  if (typeof doc.status === "string" || !doc.status) {
    const rawStr = String(doc.status || "").trim().toLowerCase();
    const isPub = rawStr === "active" || rawStr === "published";
    const statusVal = isPub ? "Published" : rawStr === "archived" ? "Archived" : "Draft";
    doc.status = { status: statusVal, published: isPub, featured: false, isDeleted: false };
  } else if (typeof doc.status === "object" && doc.status !== null) {
    const sStr = String(doc.status.status || "").trim().toLowerCase();
    if (sStr === "active" || sStr === "published") {
      doc.status.status = "Published";
      if (doc.status.published === undefined) doc.status.published = true;
    } else if (sStr === "archived") {
      doc.status.status = "Archived";
      if (doc.status.published === undefined) doc.status.published = false;
    } else if (sStr === "draft") {
      doc.status.status = "Draft";
      if (doc.status.published === undefined) doc.status.published = false;
    }
  }

  if (!doc.general || typeof doc.general !== "object") doc.general = {};
  if (!doc.general.projectName || !String(doc.general.projectName).trim()) {
    doc.general.projectName = "Untitled Project";
  }
  if (!doc.general.builderName || !String(doc.general.builderName).trim()) {
    doc.general.builderName = doc.general.projectName || "Developer";
  }
  if (!doc.general.slug || !String(doc.general.slug).trim()) {
    const generatedSlug = String(doc.general.projectName)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    doc.general.slug = generatedSlug || `project-${Date.now()}`;
  }

  if (!doc.projectTag || typeof doc.projectTag !== "string" || !doc.projectTag.trim()) {
    doc.projectTag = `P${Date.now()}`;
  }
  return doc;
};

/**
 * Normalizes + casts + validates a project document. Returns a clean doc
 * containing only schema fields (unknown keys are dropped, like Mongoose strict).
 */
const sanitizeProject = (input, { validate = true } = {}) => {
  const doc = preValidate(JSON.parse(JSON.stringify(input || {})));
  const now = new Date().toISOString();
  const clean = {};
  for (const [key, spec] of Object.entries(projectSchema)) {
    const v = castValue(spec, doc[key], key, now);
    if (v !== undefined) clean[key] = v;
  }
  if (validate) {
    for (const [key, spec] of Object.entries(projectSchema)) {
      validateValue(spec, clean[key], key);
    }
  }
  return clean;
};

/* ------------------------------------------------------------------ */
/* Row <-> document mapping                                            */
/* ------------------------------------------------------------------ */

const FIELD_MAP = {
  projectTag: "project_tag",
  projectCategory: "project_category",
  parentProject: "parent_project",
  alsoShowAsIndividual: "also_show_as_individual",
  general: "general",
  contact: "contact",
  location: "location",
  specifications: "specifications",
  filters: "filters",
  rera: "rera",
  media: "media",
  videos: "videos",
  brochures: "brochures",
  legalDocuments: "legal_documents",
  floorPlans: "floor_plans",
  seo: "seo",
  status: "status",
  mapSkin: "map_skin",
  skinSettings: "skin_settings",
};

const isoOrUndefined = (v) => (v ? new Date(v).toISOString() : undefined);

/** DB row -> API document (same shape Mongoose's toJSON produced). */
const toDoc = (row) => {
  if (!row) return null;
  const doc = { ...(row.legacy || {}), _id: row.id };
  doc.general = row.general;
  doc.projectTag = row.project_tag;
  doc.projectCategory = row.project_category;
  doc.parentProject = row.parent_project ?? null;
  doc.alsoShowAsIndividual = row.also_show_as_individual;
  doc.contact = row.contact;
  doc.location = row.location;
  doc.specifications = row.specifications;
  doc.filters = row.filters;
  doc.rera = row.rera;
  doc.media = row.media;
  doc.videos = row.videos;
  doc.brochures = row.brochures;
  doc.legalDocuments = row.legal_documents;
  doc.floorPlans = row.floor_plans;
  doc.seo = row.seo;
  doc.status = row.status;
  doc.mapSkin = row.map_skin;
  doc.skinSettings = row.skin_settings;
  doc.createdAt = isoOrUndefined(row.created_at);
  doc.updatedAt = isoOrUndefined(row.updated_at);
  return doc;
};

/** Clean document -> DB row (writable columns only). */
const toRow = (clean) => {
  const row = {};
  for (const [docKey, col] of Object.entries(FIELD_MAP)) {
    if (clean[docKey] !== undefined) row[col] = clean[docKey];
  }
  // JSONB columns are NOT NULL — fall back to empty containers
  for (const col of ["contact", "location", "filters", "rera", "media", "seo", "status", "skin_settings", "general"]) {
    if (row[col] === null) row[col] = {};
  }
  for (const col of ["specifications", "videos", "brochures", "legal_documents", "floor_plans"]) {
    if (row[col] === null) row[col] = [];
  }
  return row;
};

/** Maps Postgres unique violations to Mongo-like duplicate key errors. */
const rethrowDuplicate = (err) => {
  if (err?.code === "23505") {
    const e = new Error(`Duplicate key error: ${err.details || err.message}`);
    e.code = 11000;
    throw e;
  }
  throw err;
};

/* ------------------------------------------------------------------ */
/* Repository API                                                      */
/* ------------------------------------------------------------------ */

const PAGE = 1000;

/** Fetches every row matching a query builder factory (bypasses the 1000-row cap). */
const fetchAll = async (buildQuery) => {
  const all = [];
  for (let from = 0; ; from += PAGE) {
    const rows = unwrap(await buildQuery().range(from, from + PAGE - 1));
    all.push(...rows);
    if (rows.length < PAGE) break;
  }
  return all;
};

const findProjectById = async (id, { excludeDeleted = false } = {}) => {
  if (!isValidObjectId(String(id))) return null;
  let q = supabase.from(TABLE).select("*").eq("id", String(id).toLowerCase());
  if (excludeDeleted) q = q.eq("is_deleted", false);
  return toDoc(unwrap(await q.maybeSingle()));
};

const createProjectDoc = async (data) => {
  const clean = sanitizeProject(data);
  const row = { id: newObjectId(), ...toRow(clean) };
  try {
    return toDoc(unwrap(await supabase.from(TABLE).insert(row).select("*").single()));
  } catch (err) {
    return rethrowDuplicate(err);
  }
};

/** Persists a full (modified) project document — replacement for doc.save(). */
const saveProject = async (doc) => {
  const clean = sanitizeProject(doc);
  // projectTag is immutable
  delete clean.projectTag;
  try {
    return toDoc(
      unwrap(
        await supabase
          .from(TABLE)
          .update(toRow(clean))
          .eq("id", String(doc._id))
          .select("*")
          .single(),
      ),
    );
  } catch (err) {
    return rethrowDuplicate(err);
  }
};

const slugExists = async (slug, excludeId = null) => {
  let q = supabase.from(TABLE).select("id").eq("slug", slug).limit(1);
  if (excludeId) q = q.neq("id", String(excludeId));
  const rows = unwrap(await q);
  return rows.length > 0;
};

const findAllProjectTags = async () =>
  (await fetchAll(() => supabase.from(TABLE).select("project_tag").order("id"))).map(
    (r) => ({ projectTag: r.project_tag }),
  );

const findDeletedPortfolioIds = async () =>
  (
    await fetchAll(() =>
      supabase
        .from(TABLE)
        .select("id")
        .eq("project_category", "portfolio")
        .eq("is_deleted", true)
        .order("id"),
    )
  ).map((r) => r.id);

/** All non-deleted projects, oldest first (natural insertion order). */
const findAllActiveProjects = async () =>
  (
    await fetchAll(() =>
      supabase
        .from(TABLE)
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true }),
    )
  ).map(toDoc);

/** Sets status.isDeleted = true by ids and/or parent ids. */
const softDeleteProjects = async ({ ids = null, parentIds = null } = {}) =>
  unwrap(
    await supabase.rpc("soft_delete_projects", {
      p_ids: ids,
      p_parent_ids: parentIds,
    }),
  );

/**
 * Filtered, sorted, paginated listing.
 * @returns {Promise<{ items: object[], totalItems: number }>}
 */
const listProjects = async ({
  search = null,
  status = null,
  featured = null,
  projectCategory = null,
  parentProject = null,
  includeSubProjects = false,
  excludeParentIds = null,
  sort = "newest",
  limit = 10,
  offset = 0,
} = {}) => {
  const result = unwrap(
    await supabase.rpc("list_projects", {
      p_search: search || null,
      p_status: status || null,
      p_featured: featured === null || featured === undefined ? null : featured,
      p_category: projectCategory || null,
      p_parent: parentProject ? String(parentProject) : null,
      p_include_sub: !!includeSubProjects,
      p_exclude_parents: excludeParentIds && excludeParentIds.length ? excludeParentIds : null,
      p_sort: sort || "newest",
      p_limit: limit,
      p_offset: offset,
    }),
  );
  return {
    items: (result?.items || []).map(toDoc),
    totalItems: Number(result?.total || 0),
  };
};

export {
  projectSchema,
  sanitizeProject,
  preValidate,
  toDoc,
  toRow,
  findProjectById,
  createProjectDoc,
  saveProject,
  slugExists,
  findAllProjectTags,
  findDeletedPortfolioIds,
  findAllActiveProjects,
  softDeleteProjects,
  listProjects,
};
