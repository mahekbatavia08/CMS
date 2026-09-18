import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

function Accordion({
    className,
    ...props
}) {
    return (
        <AccordionPrimitive.Root
            data-slot="accordion"
            className={cn("flex flex-col gap-3", className)}
            {...props} />
    );
}

function AccordionItem({
    className,
    ...props
}) {
    return (
        <AccordionPrimitive.Item
            data-slot="accordion-item"
            className={cn(
                "rounded-lg border border-slate-200 bg-white overflow-hidden transition-colors dark:border-slate-800 dark:bg-slate-900",
                className
            )}
            {...props} />
    );
}

function AccordionTrigger({
    className,
    children,
    ...props
}) {
    return (
        <AccordionPrimitive.Header className="flex">
            <AccordionPrimitive.Trigger
                data-slot="accordion-trigger"
                className={cn(
                    "flex flex-1 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-slate-900 transition-all hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:text-slate-100 dark:hover:bg-slate-800/50 [&[data-open]>svg]:rotate-180",
                    className
                )}
                {...props}>
                {children}
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 dark:text-slate-400" />
            </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
    );
}

function AccordionContent({
    className,
    children,
    ...props
}) {
    return (
        <AccordionPrimitive.Panel
            data-slot="accordion-content"
            className={cn(
                "overflow-hidden text-sm data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-top-1 data-closed:animate-out data-closed:fade-out-0",
                className
            )}
            {...props}>
            <div className="border-t border-slate-100 px-4 py-4 dark:border-slate-800">{children}</div>
        </AccordionPrimitive.Panel>
    );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }