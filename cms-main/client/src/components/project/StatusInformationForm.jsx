import { Controller, useFormContext } from "react-hook-form";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Checkbox } from "@/components/ui/checkbox";

const StatusInformationForm = () => {
  const { control, watch } = useFormContext();

  const currentStatus = watch("status.status");

  const statusColor = {
    Draft: "bg-yellow-100 text-yellow-700",
    Published: "bg-green-100 text-green-700",
    Archived: "bg-slate-200 text-slate-700",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publishing</CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Status</Label>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                statusColor[currentStatus] || statusColor.Draft
              }`}
            >
              {currentStatus || "Draft"}
            </span>
          </div>

          <Controller
            name="status.status"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Draft">
                    Draft
                  </SelectItem>

                  <SelectItem value="Published">
                    Published
                  </SelectItem>

                  <SelectItem value="Archived">
                    Archived
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <Controller
          name="status.featured"
          control={control}
          render={({ field }) => (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Featured Project</Label>

                <p className="text-sm text-slate-500">
                  Highlight this project across the portfolio.
                </p>
              </div>

              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default StatusInformationForm;