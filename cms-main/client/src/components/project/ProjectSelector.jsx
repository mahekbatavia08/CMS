import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Layers, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const ProjectSelector = ({ onContinue }) => {
  const [searchParams] = useSearchParams();
  const allowMasterOnly = searchParams.get("from") === "master" || searchParams.get("type") === "portfolio";
  const [selectedType, setSelectedType] = useState(allowMasterOnly ? "portfolio" : "");

  const handleContinue = () => {
    if (!selectedType) return;
    onContinue(selectedType);
  };

  return (
    <Card className="mx-auto max-w-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-50">
          Create New Project
        </CardTitle>
        <CardDescription className="text-slate-500 dark:text-slate-400">
          Choose the type of project you would like to create.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Master Project / Portfolio Tour Option */}
        <label
          className={`block cursor-pointer rounded-xl border p-5 transition ${
            selectedType === "portfolio"
              ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-500 ring-1 ring-blue-600"
              : "border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
          }`}
        >
          <div className="flex items-start gap-4">
            <input
              type="radio"
              name="projectType"
              value="portfolio"
              checked={selectedType === "portfolio"}
              onChange={(e) => setSelectedType(e.target.value)}
              className="mt-1 accent-blue-600"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  <Layers className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                  Master Project (Portfolio)
                </h3>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Create a Master Project / Portfolio that groups and showcases multiple developments in an interactive Map &amp; Gallery.
              </p>
            </div>
          </div>
        </label>

        {/* Individual Project Option (Hidden when creating from Master context) */}
        {!allowMasterOnly && (
          <label
            className={`block cursor-pointer rounded-xl border p-5 transition ${
              selectedType === "individual"
                ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-500 ring-1 ring-blue-600"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
            }`}
          >
            <div className="flex items-start gap-4">
              <input
                type="radio"
                name="projectType"
                value="individual"
                checked={selectedType === "individual"}
                onChange={(e) => setSelectedType(e.target.value)}
                className="mt-1 accent-blue-600"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <FileText className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                    Individual Project
                  </h3>
                </div>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Create a standalone single project with 360 tour, floor plans, specifications, and details.
                </p>
              </div>
            </div>
          </label>
        )}

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleContinue}
            disabled={!selectedType}
            className="px-6"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectSelector;
