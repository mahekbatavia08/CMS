import { useForm } from "react-hook-form";

const useProjectForm = () => {
  return useForm({
    defaultValues: {
      general: {
        projectName: "",
        builderName: "",
        projectType: "",
        slug: "",
        tagline: "",
        description: "",
      },

      /************************************************
       * portfolio  = Portfolio Tour
       * individual = Individual Project
       ************************************************/
      projectCategory: "individual",

      /**
       * Controls whether an Individual Project
       * belongs to a Portfolio Tour.
       */
      addToPortfolio: false,

      /**
       * Selected Portfolio Tour
       */
      parentProject: "",

      /**
       * When true, this project also appears in the standalone
       * Individual listing even though it belongs to a Portfolio Tour.
       */
      alsoShowAsIndividual: false,

      contact: {
        phone: "",
        whatsapp: "",
        email: "",
        website: "",
        facebook: "",
        instagram: "",
        linkedin: "",
        youtube: "",
      },

      location: {
        address: "",
        city: "",
        state: "",
        pincode: "",
        googleMaps: "",
      },

      filters: {
        builder: "",
        category: "",
        propertyType: "",
        possessionStatus: "",
        city: "",
        area: "",
        squareFoot: "",
        status: "",

        amenities: [],
        tags: [],
      },

      specifications: [],

      /**
       * RERA Certificate
       */
      rera: {
        certificate: null,
      },

      media: {
        coverImage: null,
        gallery: [],
      },

      /**
       * Google Drive / YouTube / Vimeo URLs
       */
      videos: [],

      /**
       * PDF Documents
       */
      brochures: [],

      /**
       * PDF Legal Documents
       */
      legalDocuments: [],

      floorPlans: [],

      seo: {
        metaTitle: "",
        metaDescription: "",
        shareDescription: "",
      },

      status: {
        status: "Draft",
        featured: false,
      },
    },
  });
};

export default useProjectForm;