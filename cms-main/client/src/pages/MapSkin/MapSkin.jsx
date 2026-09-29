import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Check, ArrowLeft, Eye, Loader2, MapPin, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import projectService from "@/services/project/projectService";
import { ROUTES } from "@/constants/routes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AutoMapThumbnail from "@/components/project/AutoMapThumbnail";
import StickyActionBar from "@/components/project/StickyActionBar";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Master portfolios (projectCategory === "portfolio") only get the default
 * map skin (map-template.html). Every individual project uses the
 * individual map skin (individual-mapskin.html) instead.
 */
const SKIN_OPTIONS = [
  { value: "default", label: "Default Map Skin" },
];

const INDIVIDUAL_SKIN = "individual";

/** Controls of the individual map skin that can be switched on/off per project. */
const SKIN_SETTING_GROUPS = [
  {
    title: "Features",
    items: [
      { key: "dayNightToggle", label: "Day / Night" },
      { key: "currentFutureToggle", label: "Current / Future" },
      { key: "amenity", label: "Amenity" },
      { key: "floorplan", label: "Floorplan" },
      { key: "locality", label: "Locality" },
      { key: "connectivity", label: "Connectivity" },
    ],
  },
  {
    title: "Quick Actions",
    items: [
      { key: "contact", label: "Contact" },
      { key: "location", label: "Location" },
      { key: "brochure", label: "Brochure" },
      { key: "legal", label: "Legal" },
      { key: "photos", label: "Photos" },
      { key: "videos", label: "Videos" },
      { key: "floorplans", label: "Floorplans" },
      { key: "rera", label: "RERA" },
      { key: "specification", label: "Specification" },
    ],
  },
  {
    title: "Tour Controls",
    items: [
      { key: "share", label: "Share" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "vr", label: "VR" },
      { key: "sound", label: "Sound" },
      { key: "autoRotate", label: "Auto Rotate" },
      { key: "fullscreen", label: "Fullscreen" },
      { key: "aboutUs", label: "About Us" },
    ],
  },
];

// Must match the skinSettings defaults in server/models/Project.js
const DEFAULT_SKIN_SETTINGS = {
  dayNightToggle: false,
  currentFutureToggle: false,
  amenity: false,
  floorplan: false,
  locality: false,
  connectivity: false,
  contact: true,
  location: true,
  brochure: true,
  legal: true,
  photos: true,
  videos: true,
  floorplans: true,
  share: true,
  whatsapp: true,
  vr: true,
  sound: true,
  autoRotate: true,
  fullscreen: true,
  aboutUs: true,
  rera: false,
  specification: false,
};

const IndividualSkinThumbnail = () => (
  <div className="relative aspect-video w-full overflow-hidden border-b border-slate-200 bg-slate-900 dark:border-slate-800">
    <img
      src="/skins/individual-mapskin-thumb.jpg"
      alt="Individual Map Skin preview"
      className="h-full w-full object-cover"
      onError={(e) => { e.currentTarget.style.display = "none"; }}
    />
    <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-md bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur dark:bg-slate-900/90 dark:text-slate-200">
      <MapPin className="h-3.5 w-3.5 text-primary" />
      <span>360° Tour</span>
    </div>
  </div>
);

const MapThumbnail = () => {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-center select-none">
      {/* Stylized Vector Map Preview */}
      <svg
        className="h-full w-full object-cover"
        viewBox="0 0 600 340"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Land */}
        <rect width="600" height="340" className="fill-slate-100 dark:fill-slate-900" />

        {/* Water body */}
        <path
          d="M0 240 Q150 180 300 220 T600 160 L600 340 L0 340 Z"
          className="fill-sky-100 dark:fill-sky-950/40"
        />

        {/* Major Arterial Roads */}
        <path
          d="M-20 60 L620 280"
          stroke="currentColor"
          strokeWidth="14"
          className="text-amber-200/70 dark:text-amber-900/30"
          strokeLinecap="round"
        />
        <path
          d="M-20 60 L620 280"
          stroke="white"
          strokeWidth="10"
          className="dark:stroke-slate-800"
          strokeLinecap="round"
        />

        <path
          d="M180 -20 Q220 180 420 360"
          stroke="currentColor"
          strokeWidth="12"
          className="text-amber-200/70 dark:text-amber-900/30"
        />
        <path
          d="M180 -20 Q220 180 420 360"
          stroke="white"
          strokeWidth="8"
          className="dark:stroke-slate-800"
        />

        {/* Secondary Road Network */}
        <path
          d="M40 0 V340 M120 0 V340 M280 0 V340 M360 0 V340 M480 0 V340 M540 0 V340"
          stroke="currentColor"
          strokeWidth="2"
          className="text-slate-200/90 dark:text-slate-800/80"
        />
        <path
          d="M0 40 H600 M0 110 H600 M0 170 H600 M0 230 H600 M0 290 H600"
          stroke="currentColor"
          strokeWidth="2"
          className="text-slate-200/90 dark:text-slate-800/80"
        />

        {/* Green Spaces / Parks */}
        <rect
          x="70"
          y="70"
          width="90"
          height="80"
          rx="8"
          className="fill-emerald-100 dark:fill-emerald-950/30 stroke-emerald-200 dark:stroke-emerald-900/30"
        />
        <rect
          x="440"
          y="40"
          width="110"
          height="60"
          rx="8"
          className="fill-emerald-100 dark:fill-emerald-950/30 stroke-emerald-200 dark:stroke-emerald-900/30"
        />

        {/* Urban Blocks */}
        <rect
          x="190"
          y="60"
          width="70"
          height="40"
          rx="4"
          className="fill-slate-200/60 dark:fill-slate-800/60"
        />
        <rect
          x="280"
          y="120"
          width="60"
          height="35"
          rx="4"
          className="fill-slate-200/60 dark:fill-slate-800/60"
        />
        <rect
          x="360"
          y="50"
          width="60"
          height="45"
          rx="4"
          className="fill-slate-200/60 dark:fill-slate-800/60"
        />

        {/* Pin Location Indicator */}
        <g transform="translate(300, 150)">
          {/* Pulse Ripple */}
          <circle cx="0" cy="0" r="24" className="fill-black/10 dark:fill-white/10 animate-ping" />
          <circle cx="0" cy="0" r="14" className="fill-black/20 dark:fill-white/20" />
          <circle cx="0" cy="0" r="6" className="fill-black dark:fill-white" />
        </g>
      </svg>

      {/* Floating Badge */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-md bg-white/90 dark:bg-slate-900/90 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm backdrop-blur">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        <span>Vector Map</span>
      </div>
    </div>
  );
};

const MapSkin = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedSkin, setSelectedSkin] = useState("");
  const [skinSettings, setSkinSettings] = useState(DEFAULT_SKIN_SETTINGS);
  const [project, setProject] = useState(null);
  const skinMigratedRef = useRef(false);
  const saveQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setErrorMessage(null);
        const response = await projectService.getProject(id);
        const projectData = response.data?.project || response.project || response.data;
        setProject(projectData);
        setSelectedSkin(projectData?.mapSkin || "");

        setSkinSettings({
          ...DEFAULT_SKIN_SETTINGS,
          ...(projectData?.skinSettings || {}),
        });

        // Individual projects always use the individual map skin.
        if (
          projectData &&
          projectData.projectCategory !== "portfolio" &&
          projectData.mapSkin !== INDIVIDUAL_SKIN &&
          !skinMigratedRef.current
        ) {
          skinMigratedRef.current = true;
          projectService
            .updateProject(id, { mapSkin: INDIVIDUAL_SKIN })
            .then(() => setSelectedSkin(INDIVIDUAL_SKIN))
            .catch((error) => console.error("Failed to set individual map skin:", error));
        }
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error.message ||
          "Failed to load project.";
        setErrorMessage(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProject();
    } else {
      setIsLoading(false);
      setErrorMessage("No project ID specified.");
    }
  }, [id]);

  const persistMapSkin = async (skinValue) => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await projectService.updateProject(id, { mapSkin: skinValue });
    } catch (error) {
      const responseData = error?.response?.data;
      const message =
        responseData?.message ||
        error.message ||
        "Failed to save map skin.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Saves run one after another and send only the changed keys, so a slow
  // earlier request can never land last and switch an unticked control
  // back on in the saved skin.
  const persistSkinSettings = (changes, previousValues) => {
    saveQueueRef.current = saveQueueRef.current.then(async () => {
      try {
        await projectService.updateProject(id, { skinSettings: changes });
      } catch (error) {
        // Roll back only the checkboxes that failed to save.
        setSkinSettings((current) => ({ ...current, ...previousValues }));
        toast.error(
          error?.response?.data?.message ||
          error.message ||
          "Failed to save skin settings."
        );
      }
    });
    return saveQueueRef.current;
  };

  const handleBack = () => {
    navigate(ROUTES.PROJECT_EDIT.replace(":id", id));
  };

  // `standalone` opens a master's project without the master context
  // (see MapPreview.jsx); ignored for projects without a master.
  const handleViewMap = async (standalone = false) => {
    // Let pending checkbox saves finish so the preview loads them.
    await saveQueueRef.current;
    navigate(ROUTES.PROJECT_MAP_PREVIEW.replace(":id", id), {
      state: standalone ? { standalone: true } : undefined,
    });
  };

  const handleSelectMap = (skinValue, label) => {
    if (isSaving) return;

    if (selectedSkin === skinValue) {
      setSelectedSkin("");
      toast.info("Map skin unselected.");
      persistMapSkin("");
      return;
    }

    setSelectedSkin(skinValue);
    toast.success(`${label} selected.`);
    persistMapSkin(skinValue);
  };

  const applySettings = (keys, value) => {
    const previousValues = {};
    const changes = {};
    keys.forEach((key) => {
      previousValues[key] = skinSettings[key];
      changes[key] = value;
    });
    setSkinSettings((current) => ({ ...current, ...changes }));
    persistSkinSettings(changes, previousValues);
  };

  const handleToggleSetting = (key, checked) => {
    applySettings([key], Boolean(checked));
  };

  const handleToggleGroup = (group, value) => {
    const keys = group.items
      .map((item) => item.key)
      .filter((key) => Boolean(skinSettings[key]) !== value);
    if (keys.length > 0) applySettings(keys, value);
  };
  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-slate-500 dark:text-slate-400">
        <Loader2 className="mx-auto h-6 w-6 animate-spin mb-2" />
        Loading map skin settings...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-8 text-center space-y-4">
        <p className="text-red-700 dark:text-red-400 font-medium">{errorMessage}</p>
        <Button variant="outline" onClick={() => navigate(ROUTES.PROJECTS)}>
          Back to Projects
        </Button>
      </div>
    );
  }

  const projectName = project?.general?.projectName || "Untitled Project";
  const isPortfolioTour = project?.projectCategory === "portfolio";
  const parentProjectId = project?.parentProject;

  let crumbLabel = "Projects";
  let crumbLink = ROUTES.PROJECTS;

  if (isPortfolioTour) {
    crumbLabel = "Master Project";
    crumbLink = ROUTES.PROJECTS_MASTER;
  } else if (parentProjectId) {
    crumbLabel = "Master Project";
    crumbLink = ROUTES.PROJECTS_PORTFOLIO_DETAIL.replace(":portfolioId", parentProjectId);
  } else {
    crumbLabel = "Projects";
    crumbLink = ROUTES.PROJECTS_INDIVIDUAL;
  }

  const breadcrumb = (
    <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
      <Link to={crumbLink} className="hover:text-slate-900 dark:hover:text-slate-100 transition">
        {crumbLabel}
      </Link>
      <span>/</span>
      <Link
        to={ROUTES.PROJECT_EDIT.replace(":id", id)}
        title={projectName}
        className="text-slate-700 dark:text-slate-300 truncate max-w-[220px] hover:text-slate-900 dark:hover:text-slate-100 transition"
      >
        {projectName}
      </Link>
      <span>/</span>
      <span className="font-semibold text-slate-900 dark:text-slate-100">
        Select Map Skin
      </span>
    </nav>
  );

  const projectTypeLabel = isPortfolioTour
    ? "Master Portfolio"
    : parentProjectId
      ? "Master's Individual"
      : "Individual Project";

  const allSettingKeys = SKIN_SETTING_GROUPS.flatMap((group) => group.items.map((item) => item.key));
  const enabledCount = allSettingKeys.filter((key) => skinSettings[key]).length;

  const selectedBadge = (
    <div className="flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 animate-in fade-in">
      <Check className="h-3 w-3" />
      <span>Selected</span>
    </div>
  );

  return (
    <div className="space-y-6 pb-28">
      {breadcrumb}

      {/* Header */}
      <div className="flex items-start gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={handleBack}
          className="mt-1 cursor-pointer"
          title="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-3xl font-bold dark:text-slate-50">
            Select Map Skin
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="truncate">
              {isPortfolioTour
                ? "Choose the map skin for this master portfolio."
                : "Preview the map skin and choose which controls it shows."}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {projectTypeLabel}
            </span>
          </div>
        </div>
      </div>

      {isPortfolioTour ? (
        /* Map Skin Option Cards — master portfolio */
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {SKIN_OPTIONS.map((skin) => {
            const isSelected = selectedSkin === skin.value;

            return (
              <Card
                key={skin.value}
                onClick={() => handleSelectMap(skin.value, skin.label)}
                className={`py-0 gap-0 overflow-hidden ring-2 cursor-pointer transition-all duration-200 ${isSelected
                  ? "ring-black dark:ring-white shadow-md"
                  : "ring-transparent hover:ring-slate-300 dark:hover:ring-slate-700"
                  }`}
              >
                <AutoMapThumbnail project={project} />

                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between min-h-[24px]">
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {skin.label}
                    </h3>
                    {isSelected && selectedBadge}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Interactive map with every project of this master as a pin.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewMap();
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Map
                    </Button>

                    <Button
                      type="button"
                      variant={isSelected ? "outline" : "default"}
                      size="sm"
                      className="cursor-pointer"
                      disabled={isSaving}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectMap(skin.value, skin.label);
                      }}
                    >
                      {isSelected ? "Unselect" : "Select Map"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[280px_minmax(0,1fr)] lg:grid-cols-[320px_minmax(0,1fr)] items-start">
          {/* Individual Map Skin — every individual project */}
          <Card className="py-0 gap-0 overflow-hidden ring-2 ring-black dark:ring-white shadow-md md:sticky md:top-4 md:self-start z-20">
            <IndividualSkinThumbnail />

            <CardContent className="p-5 space-y-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Individual Map Skin
                </p>
                <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100" title={projectName}>
                  {projectName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {parentProjectId
                    ? "View it as part of the master (with project arrows and the master's details)."
                    : "360° tour skin used by every individual project."}
                </p>
              </div>


              <Button
                type="button"
                className="w-full cursor-pointer bg-black text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200"
                title={parentProjectId ? "View with master navigation & details" : "View Map"}
                onClick={() => handleViewMap(false)}
              >
                <Eye className="h-4 w-4" />
                View Map
              </Button>
            </CardContent>
          </Card>

          {/* Skin Controls */}
          <Card className="py-0 gap-0">
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black">
                      <SlidersHorizontal className="h-4 w-4" />
                    </span>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Skin Controls
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Tick the buttons that should appear in this project&apos;s map skin.
                    Changes save automatically.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {enabledCount} / {allSettingKeys.length} enabled
                </span>
              </div>

              {SKIN_SETTING_GROUPS.map((group) => {
                const groupEnabled = group.items.filter((item) => skinSettings[item.key]).length;
                const allOn = groupEnabled === group.items.length;

                return (
                  <div key={group.title} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {group.title}
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {groupEnabled}/{group.items.length}
                        </span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleToggleGroup(group, !allOn)}
                        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        {allOn ? "Clear all" : "Select all"}
                      </button>
                    </div>

                    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                      {group.items.map(({ key, label }) => {
                        const checked = Boolean(skinSettings[key]);
                        return (
                          <label
                            key={key}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 px-3 py-3 text-sm font-medium transition-all ${checked
                              ? "border-transparent bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-800/60"
                              }`}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => handleToggleSetting(key, value)}
                            />
                            <span>{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sticky Bottom Actions */}
      <StickyActionBar
        onBack={handleBack}
        hideSubmit
        isSubmitting={isSaving} c
      />
    </div>
  );
};

export default MapSkin;