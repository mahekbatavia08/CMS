import {
    Controller,
    useFormContext,
} from "react-hook-form";

import {
    Card,
    CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Trash2 } from "lucide-react";

const SpecificationItem = ({
    groupIndex,
    itemIndex,
    removeItem,
}) => {
    const { control } = useFormContext();

    return (
        <Card className="border-l-4 border-l-primary">
            <CardContent className="space-y-4 pt-6">
                <div className="flex justify-between items-center">
                    <h4 className="font-semibold">
                        Specification {itemIndex + 1}
                    </h4>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(itemIndex)}
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>

                <div className="space-y-2">
                    <Label>Secondary Title</Label>

                    <Controller
                        name={`specifications.${groupIndex}.items.${itemIndex}.title`}
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                placeholder="e.g. Kitchen, Floor Finish, Parking"
                            />
                        )}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Description</Label>

                    <Controller
                        name={`specifications.${groupIndex}.items.${itemIndex}.description`}
                        control={control}
                        render={({ field }) => (
                            <Textarea
                                {...field}
                                rows={4}
                                placeholder="Describe this specification..."
                            />
                        )}
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default SpecificationItem;