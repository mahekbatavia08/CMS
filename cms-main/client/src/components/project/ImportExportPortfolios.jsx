import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Upload, Loader2, FileArchive } from "lucide-react";

import projectService from "@/services/project/projectService";
import { Button } from "@/components/ui/button";
import { exportAllPortfoliosZip } from "@/lib/portfolioZipExport";

const generateSlug = (name) => {
  const base = String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${base}-${randomSuffix}`;
};

const getRowValue = (row, possibleKeys) => {
  if (!row || typeof row !== "object") return "";
  const rowKeys = Object.keys(row);

  // 1. Exact match check
  for (const key of possibleKeys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
      return String(row[key]).trim();
    }
  }

  // 2. Normalized match check (ignoring case, spaces, underscores, dashes)
  for (const key of possibleKeys) {
    const targetNorm = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    const matchedKey = rowKeys.find(
      (rk) => rk.toLowerCase().replace(/[^a-z0-9]/g, "") === targetNorm
    );
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null && String(row[matchedKey]).trim() !== "") {
      return String(row[matchedKey]).trim();
    }
  }

  // 3. Partial substring match check
  for (const key of possibleKeys) {
    const targetNorm = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    const matchedKey = rowKeys.find((rk) => {
      const rkNorm = rk.toLowerCase().replace(/[^a-z0-9]/g, "");
      return rkNorm.length > 2 && (rkNorm.includes(targetNorm) || targetNorm.includes(rkNorm));
    });
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null && String(row[matchedKey]).trim() !== "") {
      return String(row[matchedKey]).trim();
    }
  }

  return "";
};

const ImportExportPortfolios = ({ portfolios = [], allProjects = [], onImported }) => {
  const fileInputRef = useRef(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);

  // Handle Export as ZIP (Portfolio > Project > image/legal/floorplan/brochure)
  const handleExportZip = async () => {
    if (!portfolios || portfolios.length === 0) {
      toast.error("No portfolios available to export.");
      return;
    }

    setIsExportingZip(true);
    try {
      await exportAllPortfoliosZip(portfolios, allProjects);
      toast.success("Portfolios exported as ZIP successfully.");
    } catch (error) {
      console.error("ZIP export error:", error);
      toast.error("Failed to export portfolios as ZIP.");
    } finally {
      setIsExportingZip(false);
    }
  };

  // Handle Import from Excel
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result;
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet);

        if (!rawRows || rawRows.length === 0) {
          toast.error("The selected Excel file is empty.");
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        // Derive default portfolio name from filename
        const rawFileName = file.name ? file.name.replace(/\.[^/.]+$/, "") : "Imported Portfolio";
        const defaultPortfolioName = rawFileName
          .replace(/[_-]+/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase())
          .trim();

        const portfolioMap = new Map();

        const getMasterPortfolio = async (name, rowBuilder = "") => {
          const targetName = (name || defaultPortfolioName).trim();
          if (portfolioMap.has(targetName)) {
            return portfolioMap.get(targetName);
          }

          // Search in passed portfolios prop first
          const existing = portfolios.find(
            (p) =>
              p.projectCategory === "portfolio" &&
              String(p.general?.projectName || "").toLowerCase().trim() === targetName.toLowerCase()
          );

          if (existing) {
            portfolioMap.set(targetName, existing);
            return existing;
          }

          // Otherwise create a new Master Portfolio
          try {
            const masterPayload = {
              projectCategory: "portfolio",
              parentProject: null,
              general: {
                projectName: targetName,
                builderName: rowBuilder || targetName,
                slug: generateSlug(targetName),
                description: `Master Portfolio created for ${targetName}`,
              },
              status: {
                status: "Published",
                published: true,
                featured: false,
              },
            };

            const createdRes = await projectService.createProject(masterPayload);
            const createdPortfolio = createdRes.data?.project || createdRes.project || createdRes;
            portfolioMap.set(targetName, createdPortfolio);
            return createdPortfolio;
          } catch (err) {
            console.error("Failed to create master portfolio:", err);
            return null;
          }
        };

        let successCount = 0;
        let skippedCount = 0;

        for (const row of rawRows) {
          let projectName = getRowValue(row, [
            "Project Name",
            "ProjectName",
            "Project_Name",
            "Project",
            "Title",
            "Name",
          ]);

          // Fallback: if projectName not found by keys, check first non-empty cell in row
          if (!projectName) {
            const firstVal = Object.values(row).find(
              (val) => val !== undefined && val !== null && String(val).trim() !== ""
            );
            if (firstVal) {
              projectName = String(firstVal).trim();
            }
          }

          if (!projectName) {
            skippedCount++;
            continue;
          }

          let rowPortfolioName = getRowValue(row, [
            "Portfolio Name",
            "Master Portfolio",
            "Portfolio",
            "Master Project",
            "Tour Title",
          ]);

          let builderName = getRowValue(row, [
            "Builder Name",
            "BuilderName",
            "Builder_Name",
            "Builder",
            "Developer",
            "Group",
            "Company",
          ]);

          const targetPortfolioName = (rowPortfolioName || defaultPortfolioName).trim();
          const masterPortfolio = await getMasterPortfolio(targetPortfolioName, builderName);

          if (!masterPortfolio || !masterPortfolio._id) {
            skippedCount++;
            continue;
          }

          if (!builderName) {
            builderName = masterPortfolio.general?.builderName || targetPortfolioName || "Developer";
          }

          const description = getRowValue(row, ["Description", "Desc", "Details", "Tagline"]);
          const rawCategories = getRowValue(row, ["Categories", "Category", "Tags", "Types"]);
          const propertyType = getRowValue(row, ["Property Type", "PropertyType", "Type"]);
          const possessionStatus = getRowValue(row, ["Possession Status", "PossessionStatus", "Possession", "Timing"]);
          const rawCity = getRowValue(row, ["City", "Location"]);
          const city = (rawCity && !["true", "false", "null", "undefined", "1", "0"].includes(String(rawCity).trim().toLowerCase())) ? rawCity : "";
          const rawArea = getRowValue(row, ["Area", "Locality", "Sub-location"]);
          const area = (rawArea && !["true", "false", "null", "undefined", "1", "0"].includes(String(rawArea).trim().toLowerCase())) ? rawArea : "";

          let categoryArray = typeof rawCategories === "string"
            ? rawCategories.split(",").map((c) => c.trim()).filter(Boolean)
            : Array.isArray(rawCategories)
              ? rawCategories
              : [];

          let propertyTypeArray = typeof propertyType === "string"
            ? propertyType.split(",").map((t) => t.trim()).filter(Boolean)
            : [];

          const lowerProjName = String(projectName).toLowerCase();

          // Auto-infer category if empty
          if (categoryArray.length === 0) {
            if (lowerProjName.includes("industr") || lowerProjName.includes("textile park") || lowerProjName.includes("eco park")) {
              categoryArray = ["Industrial"];
            } else if (lowerProjName.includes("commercial") || lowerProjName.includes("techno park") || lowerProjName.includes("market") || lowerProjName.includes("trade")) {
              categoryArray = ["Commercial"];
            } else {
              categoryArray = ["Residential"];
            }
          }

          // Auto-infer property types if empty
          if (propertyTypeArray.length === 0) {
            if (lowerProjName.includes("bungalow") || lowerProjName.includes("bunglow")) propertyTypeArray.push("Bungalow");
            if (lowerProjName.includes("villa")) propertyTypeArray.push("Villa");
            if (lowerProjName.includes("plot") || lowerProjName.includes("park") || lowerProjName.includes("industr")) propertyTypeArray.push("Plot");
            if (lowerProjName.includes("shop")) propertyTypeArray.push("Shop");
            if (lowerProjName.includes("office")) propertyTypeArray.push("Office");
            if (lowerProjName.includes("2 bhk") || lowerProjName.includes("2bhk")) propertyTypeArray.push("2 BHK");
            if (lowerProjName.includes("3 bhk") || lowerProjName.includes("3bhk")) propertyTypeArray.push("3 BHK");
            if (propertyTypeArray.length === 0) {
              if (categoryArray.includes("Industrial")) propertyTypeArray.push("Plot");
              else if (categoryArray.includes("Commercial")) propertyTypeArray.push("Shop", "Office");
              else propertyTypeArray.push("2 BHK", "3 BHK");
            }
          }

          // Normalize possession
          let normalizedPoss = String(possessionStatus || "").trim();
          const lowerPoss = normalizedPoss.toLowerCase();
          if (!normalizedPoss || lowerPoss.includes("completed") || lowerPoss.includes("ready")) {
            normalizedPoss = "Ready Possession";
          } else if (lowerPoss.includes("on-going") || lowerPoss.includes("ongoing") || lowerPoss.includes("under")) {
            normalizedPoss = "Ongoing";
          } else if (lowerPoss.includes("coming") || lowerPoss.includes("soon")) {
            normalizedPoss = "Coming Soon";
          }

          const areaArray = typeof area === "string" && area.trim()
            ? area.split(",").map((a) => a.trim()).filter(Boolean)
            : [];

          const payload = {
            projectCategory: "individual",
            parentProject: masterPortfolio._id,
            general: {
              projectName: String(projectName).trim(),
              builderName: String(builderName).trim(),
              slug: generateSlug(projectName),
              description: String(description).trim(),
              area: area || "",
            },
            filters: {
              category: categoryArray,
              propertyType: propertyTypeArray,
              possessionStatus: possessionStatus || "Ready Possession",
              city: city || "Surat",
              area: areaArray,
            },
            status: {
              status: "Published",
              published: true,
              featured: false,
            },
          };

          try {
            await projectService.createProject(payload);
            successCount++;
          } catch (createErr) {
            console.error("Failed to import row:", row, createErr);
            skippedCount++;
          }
        }

        if (successCount > 0) {
          const portfolioNames = Array.from(portfolioMap.keys()).join(", ");
          toast.success(
            `Successfully imported ${successCount} project(s) into master portfolio "${portfolioNames}"${skippedCount > 0 ? ` (${skippedCount} skipped)` : ""}.`
          );
          await onImported?.();
        } else {
          toast.error(`Import failed. ${skippedCount} row(s) were missing required fields (Project Name).`);
        }
      } catch (parseError) {
        console.error("Import error:", parseError);
        toast.error("Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv file.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read the uploaded file.");
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx, .xls, .csv"
        onChange={handleFileUpload}
        className="hidden"
      />

      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isImporting}
        className="flex items-center gap-2 text-xs font-semibold cursor-pointer"
      >
        {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        <span>{isImporting ? "Importing..." : "Import Excel"}</span>
      </Button>

      <Button
        variant="outline"
        onClick={handleExportZip}
        disabled={isImporting || isExportingZip}
        className="flex items-center gap-2 text-xs font-semibold cursor-pointer"
      >
        {isExportingZip ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileArchive className="h-4 w-4" />}
        <span>{isExportingZip ? "Exporting ZIP..." : "Export ZIP"}</span>
      </Button>
    </div>
  );
};

export default ImportExportPortfolios;