import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, ArrowLeft, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

import projectService from "@/services/project/projectService";
import { ROUTES } from "@/constants/routes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AutoMapThumbnail from "@/components/project/AutoMapThumbnail";
import StickyActionBar from "@/components/project/StickyActionBar";

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
  const [selectedSkin, setSelectedSkin] = useState("default");
  const [isSelected, setIsSelected] = useState(false);
  const [project, setProject] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setErrorMessage(null);
        const response = await projectService.getProject(id);
        const projectData = response.data?.project || response.project || response.data;
        setProject(projectData);
        if (projectData?.mapSkin) {
          setSelectedSkin(projectData.mapSkin);
        } else {
          setSelectedSkin("default");
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

  const handleBack = () => {
    navigate(ROUTES.PROJECT_EDIT.replace(":id", id));
  };

  const handleViewMap = () => {
    navigate(ROUTES.PROJECT_MAP_PREVIEW.replace(":id", id));
  };

  const handleSelectMap = () => {
    setIsSelected((prev) => {
      const next = !prev;
      if (next) {
        setSelectedSkin("default");
        toast.success("Default Map Skin selected.");
        persistMapSkin("default");
      } else {
        setSelectedSkin("");
        toast.info("Map skin unselected.");
        persistMapSkin("");
      }
      return next;
    });
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

  return (
    <div className="space-y-8 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={handleBack}
          className="cursor-pointer"
          title="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold dark:text-slate-50">
            Select Map Skin
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Choose a map skin for this project.
          </p>
        </div>
      </div>

      {/* Single Map Skin Option Card */}
      <div className="w-full max-w-[320px]">
        <Card
          onClick={handleSelectMap}
          className={`transition-all duration-200 overflow-hidden ring-2 cursor-pointer ${isSelected
            ? "ring-black dark:ring-white border-black dark:border-white shadow-md"
            : "ring-transparent border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700"
            }`}
        >
          {/* Auto Generated Map Thumbnail */}
          <AutoMapThumbnail project={project} />

          {/* Card Details & Actions */}
          <CardContent className="p-3.5 space-y-3">
            <div className="flex items-center justify-between min-h-[24px]">
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  Default Map Skin
                </h3>
              </div>

              {/* Selected Badge - Shown ONLY after clicking Select Map */}
              {isSelected && (
                <div className="flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 animate-in fade-in">
                  <Check className="h-3 w-3" />
                  <span>Selected</span>
                </div>
              )}
            </div>

            {/* Action Buttons Inside Card */}
            <div className="flex items-center gap-2 pt-0.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewMap();
                }}
              >
                View Map
              </Button>

              <Button
                type="button"
                variant="default"
                size="sm"
                className="flex-1 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectMap();
                }}
              >
                Select Map
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sticky Bottom Actions */}
      <StickyActionBar
        onBack={handleBack}
        hideSubmit
        isSubmitting={isSaving}
      />
    </div>
  );
};

export default MapSkin;
