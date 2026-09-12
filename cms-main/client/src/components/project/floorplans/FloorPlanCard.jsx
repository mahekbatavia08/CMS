import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/utils";

export default function FloorPlanCard({ floorPlan }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <img
            src={getImageUrl(floorPlan.thumbnail)}
            alt={floorPlan.title}
            className="h-32 w-32 rounded object-cover border"
          />

          <div className="flex flex-1 flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold">{floorPlan.title}</h3>

              <p className="text-sm text-muted-foreground">
                {floorPlan.pageCount} Pages
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline">Replace</Button>

              <Button variant="outline">Rename</Button>

              <Button variant="destructive">Delete</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
