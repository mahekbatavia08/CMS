import {
    Controller,
    useFieldArray,
    useFormContext,
} from "react-hook-form";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import SpecificationItem from "./SpecificationItem";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Plus, Trash2 } from "lucide-react";

const SpecificationGroup = ({
    groupIndex,
    removeGroup,
}) => {
    const { control } = useFormContext();

    const {
        fields: items,
        append: addItem,
        remove: removeItem,
    } = useFieldArray({
        control,
        name: `specifications.${groupIndex}.items`,
    });

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                    Main Section {groupIndex + 1}
                </CardTitle>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeGroup(groupIndex)}
                >
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Primary Title</Label>

                    <Controller
                        name={`specifications.${groupIndex}.primaryTitle`}
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                placeholder="Apartment Specifications"
                            />
                        )}
                    />
                </div>

                <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() =>
                        addItem({
                            title: "",
                            description: "",
                        })
                    }
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Specification
                </Button>

                {items.length > 0 && (
                    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Specifications
                        </h4>

                        {items.map((item, itemIndex) => (
                            <SpecificationItem
                                key={item.id}
                                groupIndex={groupIndex}
                                itemIndex={itemIndex}
                                removeItem={removeItem}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default SpecificationGroup;