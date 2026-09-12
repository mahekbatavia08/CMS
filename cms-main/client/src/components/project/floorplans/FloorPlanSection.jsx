import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import FloorPlanList from "./FloorPlanList";

import { useUploadFloorPlan } from "@/hooks/project/useFloorPlanMutations";

export default function FloorPlanSection({ project }) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);

  const uploadMutation = useUploadFloorPlan();

  const handleUpload = async () => {
    if (!file) return;

    try {
      await uploadMutation.mutateAsync({
        projectId: project._id,
        data: {
          title,
          file,
        },
      });

      setTitle("");
      setFile(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Floor Plans</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Title</Label>

          <Input
            placeholder="Ground Floor"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <Label>Floor Plan File</Label>

          <Input
            type="file"
            accept="application/pdf, image/png, image/jpeg, image/jpg"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>
      </div>

      <Button
        onClick={handleUpload}
        disabled={!file || uploadMutation.isPending}
      >
        {uploadMutation.isPending ? "Uploading..." : "Upload Floor Plan"}
      </Button>

      <FloorPlanList floorPlans={project.floorPlans} />
    </div>
  );
}
