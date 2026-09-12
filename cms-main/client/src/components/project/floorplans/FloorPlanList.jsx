import FloorPlanCard from "./FloorPlanCard";

export default function FloorPlanList({ floorPlans = [] }) {
  if (floorPlans.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        No floor plans uploaded yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {floorPlans.map((floorPlan) => (
        <FloorPlanCard key={floorPlan._id} floorPlan={floorPlan} />
      ))}
    </div>
  );
}
