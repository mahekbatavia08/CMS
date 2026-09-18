import { useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { FormProvider, useFormContext } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import MediaInformationForm from "./CoverImageForm";
import VideoInformationForm from "./VideoInformationForm";
import SEOInformationForm from "./SEOInformationForm";
import StickyActionBar from "./StickyActionBar";
import { PROJECT_SECTIONS } from "@/constants/projectSections";

const slugify = (text) =>
    text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

const PortfolioTourFields = () => {
    const { register, watch, setValue, formState: { errors } } = useFormContext();
    const slugEdited = useRef(false);
    const projectName = watch("general.projectName");

    useEffect(() => {
        if (!projectName) return;
        if (!slugEdited.current) {
            setValue("general.slug", slugify(projectName), { shouldDirty: true });
        }
    }, [projectName, setValue]);

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Basic Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="projectName">
                            Tour Title <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="projectName"
                            placeholder="e.g. ABC Group Virtual Tour"
                            {...register("general.projectName", {
                                required: "Tour Title is required",
                            })}
                        />
                        {errors.general?.projectName && (
                            <p className="text-xs text-red-500 font-medium mt-1">
                                {errors.general.projectName.message}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tagline">Tagline</Label>
                        <Input
                            id="tagline"
                            autoComplete="off"
                            {...register("general.tagline")}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            rows={4}
                            placeholder="Trusted by 1500+ families..."
                            {...register("general.description")}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Contact & Location Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                placeholder="413,414,415, Gruham Plaza..."
                                {...register("location.address")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="googleMaps">Google Maps Link</Label>
                            <Input
                                id="googleMaps"
                                placeholder="https://maps.google.com/..."
                                {...register("location.googleMaps", {
                                    pattern: {
                                        value: /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d{1,5})?(\/.*)?$/i,
                                        message: "Please enter a valid Google Maps URL",
                                    },
                                })}
                            />
                            {errors.location?.googleMaps && (
                                <p className="text-xs text-red-500 font-medium mt-1">
                                    {errors.location.googleMaps.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                placeholder="+91 99799 78551"
                                {...register("contact.phone")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="website">Website Link</Label>
                            <Input
                                id="website"
                                placeholder="https://..."
                                {...register("contact.website", {
                                    pattern: {
                                        value: /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d{1,5})?(\/.*)?$/i,
                                        message: "Please enter a valid website URL",
                                    },
                                })}
                            />
                            {errors.contact?.website && (
                                <p className="text-xs text-red-500 font-medium mt-1">
                                    {errors.contact.website.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="instagram">Instagram Link</Label>
                            <Input
                                id="instagram"
                                placeholder="https://instagram.com/..."
                                {...register("contact.instagram", {
                                    pattern: {
                                        value: /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d{1,5})?(\/.*)?$/i,
                                        message: "Please enter a valid Instagram URL",
                                    },
                                })}
                            />
                            {errors.contact?.instagram && (
                                <p className="text-xs text-red-500 font-medium mt-1">
                                    {errors.contact.instagram.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="facebook">Facebook Link</Label>
                            <Input
                                id="facebook"
                                placeholder="https://facebook.com/..."
                                {...register("contact.facebook", {
                                    pattern: {
                                        value: /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d{1,5})?(\/.*)?$/i,
                                        message: "Please enter a valid Facebook URL",
                                    },
                                })}
                            />
                            {errors.contact?.facebook && (
                                <p className="text-xs text-red-500 font-medium mt-1">
                                    {errors.contact.facebook.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="youtube">YouTube Link</Label>
                            <Input
                                id="youtube"
                                placeholder="https://youtube.com/..."
                                {...register("contact.youtube", {
                                    pattern: {
                                        value: /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d{1,5})?(\/.*)?$/i,
                                        message: "Please enter a valid YouTube URL",
                                    },
                                })}
                            />
                            {errors.contact?.youtube && (
                                <p className="text-xs text-red-500 font-medium mt-1">
                                    {errors.contact.youtube.message}
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Logo */}
            <MediaInformationForm
                title="Logo"
                thumbnailLabel="Upload Logo"
                showGallery={false}
                showBrochures={false}
                showLegalDocuments={false}
                showFloorPlans={false}
                showThumbnailImage={true}
                showRera={false}
            />

            {/* Videos */}
            <div id={PROJECT_SECTIONS.videos.id}>
                <VideoInformationForm />
            </div>

            {/* SEO Information */}
            <div id={PROJECT_SECTIONS.seo.id}>
                <SEOInformationForm />
            </div>
        </div>
    );
};

const PortfolioTourForm = ({
    methods,
    onSubmit,
    onBack,
    isSubmitting = false,
    hideSubmit = false,
}) => {
    return (
        <FormProvider {...methods}>
            <form
                onSubmit={methods.handleSubmit((data) => {
                    // Inject default values for removed fields to satisfy backend schema
                    if (!data.general.builderName) {
                        data.general.builderName = data.general.projectName;
                    }
                    if (!data.general.projectType) {
                        data.general.projectType = "Commercial";
                    }
                    if (!data.status.status) {
                        data.status.status = "Published";
                        data.status.published = true;
                    }
                    onSubmit(data);
                })}
                className="space-y-8 pb-24"
            >
                <div>
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <button
                                type="button"
                                onClick={onBack}
                                className="flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                title="Back"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        )}
                        <h1 className="text-3xl font-bold dark:text-slate-50">
                            Portfolio Tour Configuration
                        </h1>
                    </div>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                        Configure the modal popup for the portfolio tour.
                    </p>
                </div>

                <PortfolioTourFields />

                <StickyActionBar
                    isSubmitting={isSubmitting}
                    submitButtonText="Save Configuration"
                    hideSubmit={hideSubmit}
                    onBack={onBack}
                />
            </form>
        </FormProvider>
    );
};

export default PortfolioTourForm;