import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

import SpecificationGroup from "./SpecificationGroup";

const EMPTY_GROUP = {
    primaryTitle: "",
    items: [],
};

const GroupTriggerLabel = ({ control, groupIndex }) => {
    const primaryTitle = useWatch({
        control,
        name: `specifications.${groupIndex}.primaryTitle`,
    });

    const items = useWatch({
        control,
        name: `specifications.${groupIndex}.items`,
    });

    const itemCount = items?.length ?? 0;

    return (
        <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate">
                {primaryTitle?.trim() || `Main Section ${groupIndex + 1}`}
            </span>
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
        </span>
    );
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

                {groups.length > 0 && (
                    <Accordion multiple>
                        {groups.map((group, groupIndex) => (
                            <AccordionItem key={group.id} value={group.id}>
                                <div className="flex items-center">
                                    <AccordionTrigger className="flex-1">
                                        <GroupTriggerLabel
                                            control={control}
                                            groupIndex={groupIndex}
                                        />
                                    </AccordionTrigger>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="mr-2 shrink-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeGroup(groupIndex);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>

                                <AccordionContent>
                                    <SpecificationGroup groupIndex={groupIndex} />
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );
};

export default SpecificationsForm;
