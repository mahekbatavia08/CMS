import { useRef } from "react";
import {
    Controller,
    useFormContext,
    useWatch,
} from "react-hook-form";

import {
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { ImagePlus, Trash2, X } from "lucide-react";

const SpecificationItem = ({
    groupIndex,
    itemIndex,
    itemId,
    removeItem,
}) => {
    const { control, setValue } = useFormContext();
    const iconInputRef = useRef(null);

    const title = useWatch({
        control,
        name: `specifications.${groupIndex}.items.${itemIndex}.title`,
    });

    const icon = useWatch({
        control,
        name: `specifications.${groupIndex}.items.${itemIndex}.icon`,
    });

    const iconFieldName = `specifications.${groupIndex}.items.${itemIndex}.icon`;

    const handleIconChange = (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setValue(iconFieldName, reader.result, { shouldDirty: true });
        };
        reader.readAsDataURL(file);
    };

    return (
        <AccordionItem
            value={itemId ?? itemIndex}
            className="border-l-4 border-l-primary"
        >
            <div className="flex items-center">
                <AccordionTrigger className="flex-1">
                    <span className="truncate">
                        {title?.trim() || `Specification ${itemIndex + 1}`}
                    </span>
                </AccordionTrigger>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mr-2 shrink-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        removeItem(itemIndex);
                    }}
                >
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>

            <AccordionContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Icon</Label>

                        <input
                            ref={iconInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleIconChange}
                        />

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => iconInputRef.current?.click()}
                                className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800/60"
                            >
                                {icon ? (
                                    <img src={icon} alt="Icon" className="h-full w-full object-cover" />
                                ) : (
                                    <ImagePlus className="h-5 w-5 text-slate-400" />
                                )}
                            </button>

                            {icon && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setValue(iconFieldName, "", { shouldDirty: true })}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
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
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

export default SpecificationItem;
