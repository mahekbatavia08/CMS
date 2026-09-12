import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import SpecificationGroup from "./SpecificationGroup";

const EMPTY_GROUP = {
    primaryTitle: "",
    items: [],
};

const SpecificationsForm = () => {
    const { control } = useFormContext();

    const {
        fields: groups,
        append: addGroup,
        remove: removeGroup,
    } = useFieldArray({
        control,
        name: "specifications",
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Specifications</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {groups.length === 0 && (
                    <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                        No specification groups added yet.
                    </div>
                )}

                <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() => addGroup(EMPTY_GROUP)}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Main Section
                </Button>

                {groups.map((group, groupIndex) => (
                    <SpecificationGroup
                        key={group.id}
                        groupIndex={groupIndex}
                        removeGroup={removeGroup}
                    />
                ))}
            </CardContent>
        </Card>
    );
};

export default SpecificationsForm;