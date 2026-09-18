import {
    Controller,
    useFieldArray,
    useFormContext,
} from "react-hook-form";

import { Accordion } from "@/components/ui/accordion";
import SpecificationItem from "./SpecificationItem";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Plus } from "lucide-react";

const SpecificationGroup = ({
    groupIndex,
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
        <div className="space-y-6">
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

            {items.length > 0 && (
                <Accordion multiple>
                    {items.map((item, itemIndex) => (
                        <SpecificationItem
                            key={item.id}
                            groupIndex={groupIndex}
                            itemIndex={itemIndex}
                            itemId={item.id}
                            removeItem={removeItem}
                        />
                    ))}
                </Accordion>
            )}

            <Button
                type="button"
                variant="outline"
                className="w-full border-dashed"
                onClick={() =>
                    addItem({
                        title: "",
                        description: "",
                        icon: "",
                    })
                }
            >
                <Plus className="mr-2 h-4 w-4" />
                Add Specification
            </Button>
        </div>
    );
};

export default SpecificationGroup;
