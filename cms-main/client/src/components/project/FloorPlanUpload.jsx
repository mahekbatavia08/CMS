import { useRef } from "react";
import { Plus, Trash2, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FloorPlanUpload = ({ value = [], onChange }) => {
  const fileInputRef = useRef(null);

  const addFiles = (files) => {
    const newPlans = Array.from(files || []).map((file) => ({
      title: file.name.replace(/\.[^/.]+$/, ""),
      file,
    }));

    if (newPlans.length) {
      onChange([...value, ...newPlans]);
    }
  };

  const removeFloorPlan = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateTitle = (index, title) => {
    const updated = [...value];
    updated[index] = { ...updated[index], title };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Floor Plans</Label>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus className="mr-2 h-4 w-4" />
          Upload Floor Plans
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="application/pdf, image/png, image/jpeg, image/jpg"
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {value.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No floor plans added.
        </div>
      )}

      {value.map((floorPlan, index) => (
        <div key={index} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-4">
              <div>
                <Label>Title</Label>

                <Input
                  placeholder="Ground Floor"
                  value={floorPlan.title}
                  onChange={(e) => updateTitle(index, e.target.value)}
                />
              </div>

              {floorPlan.file && (
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <FileText className="h-4 w-4" />
                  <span>{floorPlan.file.name}</span>
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => removeFloorPlan(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FloorPlanUpload;
