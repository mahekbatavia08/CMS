import { Card, CardContent } from "@/components/ui/card";

const StatsCard = ({ title, value }) => {
  return (
    <Card className="border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-colors">
      <CardContent className="p-6">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </p>

        <h2 className="mt-3 text-4xl font-bold text-slate-900 dark:text-slate-100">
          {value}
        </h2>
      </CardContent>
    </Card>
  );
};

export default StatsCard;