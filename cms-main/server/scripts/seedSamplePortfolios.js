import "dotenv/config";
import mongoose from "mongoose";
import Project from "../models/Project.js";

const sampleData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/portfolio-cms");
    console.log("Connected to MongoDB for Sample Seeding");

    // Clean up existing sample portfolios if re-running
    const existingPortfolios = await Project.find({
      projectCategory: "portfolio",
      "general.projectName": { $in: ["Portfolio A", "Portfolio B", "Portfolio C"] },
    });

    const portfolioIds = existingPortfolios.map((p) => p._id);
    if (portfolioIds.length > 0) {
      await Project.deleteMany({ parentProject: { $in: portfolioIds } });
      await Project.deleteMany({ _id: { $in: portfolioIds } });
      console.log("Cleaned up existing sample portfolios and their child projects");
    }

    // 1. Create 3 Master Portfolios
    const portfolioA = await Project.create({
      projectTag: "PORT-A-" + Date.now(),
      projectCategory: "portfolio",
      parentProject: null,
      general: {
        projectName: "Portfolio A",
        builderName: "Apex & Skyline Consortium",
        slug: "portfolio-a",
        description: "Flagship master portfolio featuring premium residential, commercial, and industrial developments across metropolitan corridors.",
      },
      status: { status: "Published", featured: true },
      mapSkin: "default",
    });

    const portfolioB = await Project.create({
      projectTag: "PORT-B-" + Date.now(),
      projectCategory: "portfolio",
      parentProject: null,
      general: {
        projectName: "Portfolio B",
        builderName: "Urban Heritage Group",
        slug: "portfolio-b",
        description: "Curated residential living communities and integrated commercial business parks.",
      },
      status: { status: "Published", featured: true },
      mapSkin: "default",
    });

    const portfolioC = await Project.create({
      projectTag: "PORT-C-" + Date.now(),
      projectCategory: "portfolio",
      parentProject: null,
      general: {
        projectName: "Portfolio C",
        builderName: "Prime Logistics & Hospitality",
        slug: "portfolio-c",
        description: "Industrial hubs, luxury hospitality resorts, and ultra-luxury penthouses.",
      },
      status: { status: "Published", featured: false },
      mapSkin: "default",
    });

    console.log("Created 3 Master Portfolios: Portfolio A, Portfolio B, Portfolio C");

    // 2. Create 10 Projects across the 3 Portfolios
    const projectsData = [
      // Portfolio A (4 projects)
      {
        projectTag: "PROJ-ALPHA-" + Date.now(),
        projectCategory: "individual",
        parentProject: portfolioA._id,
        general: {
          projectName: "Project Alpha",
          builderName: "ABC Developers",
          slug: "project-alpha",
          description: "Luxury high-rise residential apartment project with panoramic city views.",
        },
        filters: {
          category: ["Residential"],
          propertyType: ["2 BHK", "3 BHK", "Penthouse"],
          possessionStatus: "Ongoing",
          city: "Ahmedabad",
          area: ["Vesu", "VIP Road"],
        },
        status: { status: "Draft", featured: false },
        mapSkin: "default",
      },
      {
        projectTag: "PROJ-BETA-" + Date.now(),
        projectCategory: "individual",
        parentProject: portfolioA._id,
        general: {
          projectName: "Project Beta",
          builderName: "XYZ Developers",
          slug: "project-beta",
          description: "Grade-A corporate office hub with modern amenities and retail storefronts.",
        },
        filters: {
          category: ["Commercial"],
          propertyType: ["Office", "Shop"],
          possessionStatus: "Ready Position",
          city: "Ahmedabad",
          area: ["SG Highway", "Prahlad Nagar"],
        },
        status: { status: "Published", featured: true },
        mapSkin: "default",
      },
      {
        projectTag: "PROJ-GAMMA-" + Date.now(),
        projectCategory: "individual",
        parentProject: portfolioA._id,
        general: {
          projectName: "Project Gamma",
          builderName: "Skyline Group",
          slug: "project-gamma",
          description: "High-throughput industrial logistics park and warehouse facility.",
        },
        filters: {
          category: ["Industrial"],
          propertyType: ["Plot", "Shop"],
          possessionStatus: "Coming Soon",
          city: "Ahmedabad",
          area: ["Sanand", "Changodar"],
        },
        status: { status: "Draft", featured: false },
        mapSkin: "default",
      },
      {
        projectTag: "PROJ-DELTA-" + Date.now(),
        projectCategory: "individual",
        parentProject: portfolioA._id,
        general: {
          projectName: "Project Delta",
          builderName: "Apex Realty",
          slug: "project-delta",
          description: "Retail shopping arcade and multi-brand entertainment destination.",
        },
        filters: {
          category: ["Commercial"],
          propertyType: ["Shop"],
          possessionStatus: "Ongoing",
          city: "Ahmedabad",
          area: ["Sindhu Bhavan", "Bodakdev"],
        },
        status: { status: "Published", featured: false },
        mapSkin: "default",
      },

      // Portfolio B (3 projects)
      {
        projectTag: "PROJ-EPSILON-" + Date.now(),
        projectCategory: "individual",
        parentProject: portfolioB._id,
        general: {
          projectName: "Project Epsilon",
          builderName: "Urban Builders",
          slug: "project-epsilon",
          description: "Gated enclave of bespoke luxury villas and landscaped gardens.",
        },
        filters: {
          category: ["Residential"],
          propertyType: ["Villa", "Bungalow"],
          possessionStatus: "Ready Position",
          city: "Ahmedabad",
          area: ["Bopal", "Ambli"],
        },
        status: { status: "Published", featured: true },
        mapSkin: "default",
      },
      {
        projectTag: "PROJ-ZETA-" + Date.now(),
        projectCategory: "individual",
        parentProject: portfolioB._id,
        general: {
          projectName: "Project Zeta",
          builderName: "Metro Group",
          slug: "project-zeta",
          description: "Boutique commercial towers and tech offices.",
        },
        filters: {
          category: ["Commercial"],
          propertyType: ["Office"],
          possessionStatus: "Ongoing",
          city: "Ahmedabad",
          area: ["Navrangpura", "Ashram Road"],
        },
        status: { status: "Draft", featured: false },
        mapSkin: "default",
      },
      {
        projectTag: "PROJ-ETA-" + Date.now(),
        projectCategory: "individual",
        parentProject: portfolioB._id,
        general: {
          projectName: "Project Eta",
          builderName: "Skyline Group",
          slug: "project-eta",
          description: "Integrated mixed-use lifestyle development with residences and retail.",
        },
        filters: {
          category: ["Residential", "Commercial"],
          propertyType: ["3 BHK", "4 BHK", "Shop"],
          possessionStatus: "Coming Soon",
          city: "Ahmedabad",
          area: ["Science City", "Gota"],
        },
        status: { status: "Published", featured: true },
        mapSkin: "default",
      },

      // Portfolio C (3 projects)
      {
        projectTag: "PROJ-THETA-" + Date.now(),
        projectCategory: "individual",
        parentProject: portfolioC._id,
        general: {
          projectName: "Project Theta",
          builderName: "Indo Corp",
          slug: "project-theta",
          description: "Heavy manufacturing and industrial engineering park.",
        },
        filters: {
          category: ["Industrial"],
          propertyType: ["Plot", "Office"],
          possessionStatus: "Ready Position",
          city: "Ahmedabad",
          area: ["Vatva", "Narol"],
        },
        status: { status: "Draft", featured: false },
        mapSkin: "default",
      },
      {
        projectTag: "PROJ-IOTA-" + Date.now(),
        projectCategory: "individual",
        parentProject: portfolioC._id,
        general: {
          projectName: "Project Iota",
          builderName: "Apex Realty",
          slug: "project-iota",
          description: "5-star luxury resort and hospitality convention center.",
        },
        filters: {
          category: ["Hospitality"],
          propertyType: [],
          possessionStatus: "Ongoing",
          city: "Ahmedabad",
          area: ["Sanand Road", "Thol"],
        },
        status: { status: "Published", featured: true },
        mapSkin: "default",
      },
      {
        projectTag: "PROJ-KAPPA-" + Date.now(),
        projectCategory: "individual",
        parentProject: portfolioC._id,
        general: {
          projectName: "Project Kappa",
          builderName: "Prime Group",
          slug: "project-kappa",
          description: "Ultra-luxury waterfront penthouses and duplex residences.",
        },
        filters: {
          category: ["Residential"],
          propertyType: ["4 BHK", "Penthouse"],
          possessionStatus: "Coming Soon",
          city: "Ahmedabad",
          area: ["Riverfront", "Pal"],
        },
        status: { status: "Published", featured: true },
        mapSkin: "default",
      },
    ];

    for (const p of projectsData) {
      await Project.create(p);
    }
    console.log(`Successfully seeded ${projectsData.length} sample projects across the 3 Portfolios.`);

    // 3. Ensure standalone individual projects exist
    const standaloneCount = await Project.countDocuments({
      projectCategory: "individual",
      parentProject: null,
      "status.isDeleted": { $ne: true },
    });

    if (standaloneCount === 0) {
      await Project.create({
        projectTag: "IND-PROJ-1-" + Date.now(),
        projectCategory: "individual",
        parentProject: null,
        general: {
          projectName: "Individual Project 1",
          builderName: "Horizon Developers",
          slug: "individual-project-1",
          description: "Independent premium residential tower.",
        },
        filters: {
          category: ["Residential"],
          propertyType: ["3 BHK", "4 BHK"],
          possessionStatus: "Ready Position",
          city: "Ahmedabad",
          area: ["Satellite"],
        },
        status: { status: "Published", featured: true },
        mapSkin: "default",
      });

      await Project.create({
        projectTag: "IND-PROJ-2-" + Date.now(),
        projectCategory: "individual",
        parentProject: null,
        general: {
          projectName: "Individual Project 2",
          builderName: "Nova Infra",
          slug: "individual-project-2",
          description: "Standalone commercial shopping and office complex.",
        },
        filters: {
          category: ["Commercial"],
          propertyType: ["Office", "Shop"],
          possessionStatus: "Ongoing",
          city: "Ahmedabad",
          area: ["Vastrapur"],
        },
        status: { status: "Draft", featured: false },
        mapSkin: "default",
      });
      console.log("Seeded 2 standalone Individual Projects.");
    }

    console.log("Sample Data Seeding Complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding sample data:", error);
    process.exit(1);
  }
};

sampleData();
