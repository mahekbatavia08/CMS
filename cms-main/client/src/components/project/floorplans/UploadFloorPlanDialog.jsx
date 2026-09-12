import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useUploadFloorPlan } from "@/hooks/project/useFloorPlanMutations";

export default function UploadFloorPlanDialog({
  open,
  onOpenChange,
  projectId,
}) {
  const [title, setTitle] = useState("");
  const [pdf, setPdf] = useState(null);

  const uploadMutation = useUploadFloorPlan();

  const handleUpload = async () => {
    if (!pdf) return;

    try {
      await uploadMutation.mutateAsync({
        projectId,
        data: {
          title,
          pdf,
        },
      });

      setTitle("");
      setPdf(null);

      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Floor Plan</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>

            <Input
              id="title"
              placeholder="Ground Floor"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="pdf">PDF File</Label>

            <Input
              id="pdf"
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdf(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleUpload}
            disabled={!pdf || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
