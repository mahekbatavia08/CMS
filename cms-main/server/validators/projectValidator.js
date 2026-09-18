import { body } from "express-validator";

const PROJECT_TYPES = [
  "Residential",
  "Commercial",
  "Industrial",
  "Mixed Use",
];

const PROJECT_STATUSES = [
  "Draft",
  "Published",
  "Archived",
];

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * ==========================================
 * 1. General Validation
 * ==========================================
 */
const generalValidation = (isCreate) => {
  const projectNameChain = isCreate
    ? body("general.projectName")
      .notEmpty()
      .withMessage("Project name is required")
    : body("general.projectName").optional({ checkFalsy: true });

  const builderNameChain = isCreate
    ? body("general.builderName")
      .notEmpty()
      .withMessage("Builder name is required")
    : body("general.builderName").optional({ checkFalsy: true });

  const slugChain = isCreate
    ? body("general.slug")
      .notEmpty()
      .withMessage("Slug is required")
    : body("general.slug").optional({ checkFalsy: true });

  return [
    projectNameChain
      .bail()
      .isString()
      .withMessage("Project name must be a string")
      .trim()
      .isLength({ max: 150 })
      .withMessage(
        "Project name must not exceed 150 characters"
      ),

    builderNameChain
      .bail()
      .isString()
      .withMessage("Builder name must be a string")
      .trim(),

    slugChain
      .bail()
      .isString()
      .withMessage("Slug must be a string")
      .trim()
      .toLowerCase()
      .matches(SLUG_REGEX)
      .withMessage(
        "Slug must be lowercase, URL-friendly, and contain no spaces"
      ),

    body("general.projectType")
      .optional({ values: "falsy" })
      .isIn(PROJECT_TYPES)
      .withMessage(
        `Project type must be one of: ${PROJECT_TYPES.join(", ")}`
      ),

    body("general.tagline")
      .optional({ values: "falsy" })
      .isString()
      .withMessage("Tagline must be a string")
      .trim(),

    body("general.description")
      .optional({ values: "falsy" })
      .isString()
      .withMessage("Description must be a string")
      .trim(),
  ];
};

/**
 * ==========================================
 * 2. Project Category Validation
 * ==========================================
 */
const projectCategoryValidation = (isCreate) => {
  const categoryChain = isCreate
    ? body("projectCategory")
        .exists()
        .withMessage("Project category is required")
    : body("projectCategory").optional({ values: "falsy" });

  return [
    categoryChain
      .isIn(["portfolio", "individual"])
      .withMessage(
        "Project category must be either 'portfolio' or 'individual'"
      ),

    // parentProject is OPTIONAL for Individual Projects
    body("parentProject")
      .optional({ values: "falsy" })
      .isMongoId()
      .withMessage("Invalid Portfolio Tour selected"),

    // Portfolio Tours cannot have a parent project
    body("parentProject")
      .if(body("projectCategory").equals("portfolio"))
      .custom((value) => {
        if (
          value === null ||
          value === "" ||
          value === undefined
        ) {
          return true;
        }

        throw new Error(
          "Portfolio Tours cannot have a parent project"
        );
      }),
  ];
};

/**
 * ==========================================
 * 2. Contact Validation
 * ==========================================
 */
const contactValidation = () => [
  body("contact.phone")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Phone must be a string")
    .trim(),

  body("contact.whatsapp")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("WhatsApp number must be a string")
    .trim(),

  body("contact.email")
    .optional({ values: "falsy" })
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("contact.website")
    .optional({ values: "falsy" })
    .trim()
    .isURL()
    .withMessage("Website must be a valid URL"),

  body("contact.facebook")
    .optional({ values: "falsy" })
    .trim()
    .isURL()
    .withMessage("Facebook URL must be valid"),

  body("contact.instagram")
    .optional({ values: "falsy" })
    .trim()
    .isURL()
    .withMessage("Instagram URL must be valid"),

  body("contact.youtube")
    .optional({ values: "falsy" })
    .trim()
    .isURL()
    .withMessage("YouTube URL must be valid"),

  body("contact.linkedin")
    .optional({ values: "falsy" })
    .trim()
    .isURL()
    .withMessage("LinkedIn URL must be valid"),
];

/**
 * ==========================================
 * 3. Location Validation
 * ==========================================
 */
const locationValidation = () => [
  body("location.address")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Address must be a string")
    .trim(),

  body("location.city")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("City must be a string")
    .trim(),

  body("location.state")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("State must be a string")
    .trim(),

  body("location.pincode")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Pincode must be a string")
    .trim(),

  body("location.googleMaps")
    .optional({ values: "falsy" })
    .trim()
    .isURL()
    .withMessage("Google Maps link must be a valid URL"),
];

/**
 * ==========================================
 * 4. Media Validation
 * ==========================================
 */
const mediaValidation = () => [
  /**
   * Gallery
   */
  body("media.gallery")
    .optional({ values: "falsy" })
    .isArray()
    .withMessage("Gallery must be an array"),

  body("media.gallery.*.url")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Gallery item URL must be a string")
    .trim(),

  body("media.gallery.*.caption")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Gallery item caption must be a string")
    .trim(),

  body("media.gallery.*.displayOrder")
    .optional({ values: "falsy" })
    .isInt()
    .withMessage("Gallery item display order must be a number"),

  /**
   * Videos (Google Drive / YouTube / Vimeo etc.)
   */
  body("videos")
    .optional({ values: "falsy" })
    .isArray()
    .withMessage("Videos must be an array"),

  body("videos.*.title")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Video title must be a string")
    .trim(),

  body("videos.*.url")
    .optional({ values: "falsy" })
    .trim()
    .isURL()
    .withMessage("Video URL must be a valid URL"),

  body("videos.*.thumbnail")
    .optional({ values: "falsy" })
    .trim()
    .isURL()
    .withMessage("Video thumbnail must be a valid URL"),

  body("videos.*.displayOrder")
    .optional({ values: "falsy" })
    .isInt()
    .withMessage("Video display order must be a number"),

  /**
   * Floor Plans
   */
  body("floorPlans")
    .optional({ values: "falsy" })
    .isArray()
    .withMessage("Floor plans must be an array"),

  body("floorPlans.*.title")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Floor plan title must be a string")
    .trim(),

  body("floorPlans.*.url")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Floor plan URL must be a string")
    .trim(),

  body("floorPlans.*.displayOrder")
    .optional({ values: "falsy" })
    .isInt()
    .withMessage("Floor plan display order must be a number"),

  /**
   * Brochures
   */
  body("brochures")
    .optional({ values: "falsy" })
    .isArray()
    .withMessage("Brochures must be an array"),

  body("brochures.*.title")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Brochure title must be a string")
    .trim(),

  body("brochures.*.url")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Brochure URL must be a string")
    .trim(),

  /**
   * Legal Documents
   */
  body("legalDocuments")
    .optional({ values: "falsy" })
    .isArray()
    .withMessage("Legal documents must be an array"),

  body("legalDocuments.*.title")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Legal document title must be a string")
    .trim(),

  body("legalDocuments.*.url")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Legal document URL must be a string")
    .trim(),
];

/**
 * ==========================================
 * 5. SEO Validation
 * ==========================================
 */
const seoValidation = () => [
  body("seo.metaTitle")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Meta title must be a string")
    .trim(),

  body("seo.metaDescription")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Meta description must be a string")
    .trim(),

  body("seo.shareDescription")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Share description must be a string")
    .trim(),
];

/**
 * ==========================================
 * 6. Status Validation
 * ==========================================
 */
const statusValidation = () => [
  body("status.featured")
    .optional()
    .isBoolean()
    .withMessage("Featured must be a boolean"),

  body("status.status")
    .optional({ values: "falsy" })
    .isIn(PROJECT_STATUSES)
    .withMessage(
      `Status must be one of: ${PROJECT_STATUSES.join(", ")}`
    ),
];

const mapSkinValidation = () => [
  body("mapSkin")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Map skin must be a string")
    .trim(),
];

/**
 * ==========================================
 * Composed Validators
 * ==========================================
 */

const createProjectValidator = [
  ...generalValidation(true),
  ...projectCategoryValidation(true),
  ...contactValidation(),
  ...locationValidation(),
  ...mediaValidation(),
  ...seoValidation(),
  ...statusValidation(),
  ...mapSkinValidation(),
];

const updateProjectValidator = [
  ...generalValidation(false),
  ...projectCategoryValidation(false),
  ...contactValidation(),
  ...locationValidation(),
  ...mediaValidation(),
  ...seoValidation(),
  ...statusValidation(),
  ...mapSkinValidation(),
];

export {
  createProjectValidator,
  updateProjectValidator,
};