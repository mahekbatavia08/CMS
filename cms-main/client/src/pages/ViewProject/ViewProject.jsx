import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Phone,
  MapPin,
  Activity,
  Image as ImageIcon,
  Video,
  FileText,
  ShieldCheck,
  Search,
  Pencil,
  ArrowLeft,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_SECTIONS } from "@/constants/projectSections";
import projectService from "@/services/project/projectService";
import { ROUTES } from "@/constants/routes";
import { getImageUrl } from "@/lib/utils";
import GalleryLightbox from "@/components/project/GalleryLightbox";

export default function ViewProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isLogoOpen, setIsLogoOpen] = useState(false);
  const [isThumbnailOpen, setIsThumbnailOpen] = useState(false);

  const { data, isLoading: loading, isError } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectService.getProject(id),
    enabled: !!id,
  });

  // Server returns { success, data: { project } }
  const project = data?.data?.project ?? data?.project ?? null;

  const handleEditSection = (sectionSlug) => {
    const editPath = ROUTES.PROJECT_EDIT.replace(":id", id);
    navigate(`${editPath}?section=${sectionSlug}`);
  };

  const isPortfolioTour = project?.projectCategory === "portfolio";

  const { data: childProjectsData } = useQuery({
    queryKey: ["child-projects", id],
    queryFn: () => projectService.getProjects({ parentProject: id, limit: 100 }),
    enabled: !!id && isPortfolioTour,
  });

  const childProjects = childProjectsData?.data?.items || childProjectsData?.items || [];

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading project details...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500">Failed to load project details.</div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center text-red-500">Project not found.</div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link to={ROUTES.PROJECTS} className="hover:text-slate-900 dark:hover:text-slate-100 transition">
          Projects
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-xs">
          {project.general?.projectName || "View Project"}
        </span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {project.general?.projectName || "Untitled Project"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Project Overview Details
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate(ROUTES.PROJECT_EDIT.replace(":id", id))}
        >
          <Pencil className="mr-2 h-4 w-4" />
          {isPortfolioTour ? "Edit Portfolio Tour" : "Edit Full Project"}
        </Button>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. General Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              {PROJECT_SECTIONS.general.label}
            </CardTitle>
            {!isPortfolioTour && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditSection(PROJECT_SECTIONS.general.slug)}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-2 pt-2 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Title:</span>{" "}
              {project.general?.projectName || "N/A"}
            </div>
            {isPortfolioTour && (
              <div>
                <span className="font-medium text-muted-foreground">Tagline:</span>{" "}
                {project.general?.tagline || "N/A"}
              </div>
            )}
            {!isPortfolioTour && (
              <div>
                <span className="font-medium text-muted-foreground">
                  Project Type:
                </span>{" "}
                {project.general?.projectType || "N/A"}
              </div>
            )}
            <div>
              <span className="font-medium text-muted-foreground">
                Category:
              </span>{" "}
              {isPortfolioTour ? "Portfolio Tour" : "Individual Project"}
            </div>
            <div>
              <span className="font-medium text-muted-foreground">
                Description:
              </span>{" "}
              {project.general?.description || "N/A"}
            </div>
          </CardContent>
        </Card>

        {/* 2. Contact Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              {PROJECT_SECTIONS.contact.label}
            </CardTitle>
            {!isPortfolioTour && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditSection(PROJECT_SECTIONS.contact.slug)}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-2 pt-2 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Phone:</span>{" "}
              {project.contact?.phone || "N/A"}
            </div>
            {!isPortfolioTour && (
              <>
                <div>
                  <span className="font-medium text-muted-foreground">Email:</span>{" "}
                  {project.contact?.email || "N/A"}
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    WhatsApp:
                  </span>{" "}
                  {project.contact?.whatsapp || "N/A"}
                </div>
              </>
            )}
            {isPortfolioTour && (
              <>
                <div>
                  <span className="font-medium text-muted-foreground">Website:</span>{" "}
                  {project.contact?.website || "N/A"}
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Instagram:</span>{" "}
                  {project.contact?.instagram || "N/A"}
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Facebook:</span>{" "}
                  {project.contact?.facebook || "N/A"}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 3. Location */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              {PROJECT_SECTIONS.location.label}
            </CardTitle>
            {!isPortfolioTour && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditSection(PROJECT_SECTIONS.location.slug)}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-2 pt-2 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">
                Address:
              </span>{" "}
              {project.location?.address || "N/A"}
            </div>
            {!isPortfolioTour && (
              <>
                <div>
                  <span className="font-medium text-muted-foreground">City:</span>{" "}
                  {project.location?.city || "N/A"}
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">State:</span>{" "}
                  {project.location?.state || "N/A"}
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    Pincode:
                  </span>{" "}
                  {project.location?.pincode || "N/A"}
                </div>
              </>
            )}
            {isPortfolioTour && (
              <div>
                <span className="font-medium text-muted-foreground">Google Maps:</span>{" "}
                {project.location?.googleMaps ? (
                  <a href={project.location.googleMaps} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                    View Link
                  </a>
                ) : (
                  "N/A"
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. Project Status */}
        {!isPortfolioTour && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                {PROJECT_SECTIONS.status.label}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditSection(PROJECT_SECTIONS.status.slug)}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 pt-2 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Status:</span>{" "}
                {project.status?.status || "Draft"}
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  Featured:
                </span>{" "}
                {project.status?.featured ? "Yes" : "No"}
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  Published:
                </span>{" "}
                {project.status?.published ? "Yes" : "No"}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 5. Main Media & Banner */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              {PROJECT_SECTIONS.media.label}
            </CardTitle>
            {!isPortfolioTour && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditSection(PROJECT_SECTIONS.media.slug)}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4 pt-2 text-sm flex gap-6">
            <div>
              {project.media?.coverImage?.url ? (
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-muted-foreground font-semibold">
                    Logo
                  </span>
                  <img
                    src={getImageUrl(project.media.coverImage.url)}
                    alt="Logo"
                    className="h-20 w-32 object-contain p-1 rounded border cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setIsLogoOpen(true)}
                  />
                </div>
              ) : (
                <p className="text-muted-foreground">No logo uploaded.</p>
              )}
            </div>

            {isPortfolioTour && (
              <div>
                {project.media?.thumbnailImage?.url ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-muted-foreground font-semibold">
                      Thumbnail
                    </span>
                    <img
                      src={getImageUrl(project.media.thumbnailImage.url)}
                      alt="Thumbnail"
                      className="h-20 w-32 object-contain p-1 rounded border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setIsThumbnailOpen(true)}
                    />
                  </div>
                ) : (
                  <p className="text-muted-foreground">No thumbnail uploaded.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 6. Gallery */}
        {!isPortfolioTour && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                {PROJECT_SECTIONS.gallery.label}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditSection(PROJECT_SECTIONS.gallery.slug)}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
              </Button>
            </CardHeader>
            <CardContent className="pt-2 text-sm">
              {(() => {
                const allImages = project.media?.gallery?.flatMap(album => album.images) || [];
                if (allImages.length > 0) {
                  return (
                    <div className="grid grid-cols-4 gap-2 cursor-pointer" onClick={() => setIsGalleryOpen(true)}>
                      {allImages.slice(0, 4).map((img, idx) => (
                        <img
                          key={idx}
                          src={getImageUrl(img.url)}
                          alt={`Gallery ${idx + 1}`}
                          className="h-16 w-full object-cover rounded border hover:opacity-80 transition-opacity"
                        />
                      ))}
                      {allImages.length > 4 && (
                        <div className="h-16 flex items-center justify-center bg-muted hover:bg-slate-200 transition-colors rounded text-xs font-medium">
                          +{allImages.length - 4} more
                        </div>
                      )}
                    </div>
                  );
                }
                return <p className="text-muted-foreground">No gallery images added.</p>;
              })()}
            </CardContent>
          </Card>
        )}

        <GalleryLightbox
          images={project?.media?.gallery?.flatMap(album => album.images) || []}
          open={isGalleryOpen}
          onOpenChange={setIsGalleryOpen}
        />

        <GalleryLightbox
          images={project?.media?.coverImage ? [project.media.coverImage] : []}
          open={isLogoOpen}
          onOpenChange={setIsLogoOpen}
        />

        <GalleryLightbox
          images={project?.media?.thumbnailImage ? [project.media.thumbnailImage] : []}
          open={isThumbnailOpen}
          onOpenChange={setIsThumbnailOpen}
        />

        {/* 7. Videos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              {PROJECT_SECTIONS.videos.label}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditSection(PROJECT_SECTIONS.videos.slug)}
            >
              <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 pt-2 text-sm">
            {project.videos && project.videos.length > 0 ? (
              <ul className="list-disc pl-4 space-y-1">
                {project.videos.map((vid, idx) => (
                  <li key={idx} className="truncate text-blue-600 dark:text-blue-400 underline">
                    <a
                      href={vid.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {vid.title || `Video ${idx + 1}`}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No videos linked.</p>
            )}
          </CardContent>
        </Card>

        {/* 8. Brochure & Attachments */}
        {!isPortfolioTour && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {PROJECT_SECTIONS.brochure.label}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditSection(PROJECT_SECTIONS.brochure.slug)}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 pt-2 text-sm">
              {project.brochures && project.brochures.length > 0 ? (
                <ul className="list-disc pl-4 space-y-1">
                  {project.brochures.map((doc, idx) => (
                    <li key={idx} className="truncate text-blue-600 underline">
                      <a href={getImageUrl(doc.url)} target="_blank" rel="noreferrer">
                        <FileText className="inline h-4 w-4 mr-1" /> {doc.title || `Brochure ${idx + 1}`}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No brochure uploaded.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* 9. Legal Documents */}
        {!isPortfolioTour && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {PROJECT_SECTIONS.legal.label}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditSection(PROJECT_SECTIONS.legal.slug)}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 pt-2 text-sm">
              {project.legalDocuments && project.legalDocuments.length > 0 ? (
                <ul className="list-disc pl-4 space-y-1">
                  {project.legalDocuments.map((doc, idx) => (
                    <li key={idx} className="truncate text-blue-600 underline">
                      <a href={getImageUrl(doc.url)} target="_blank" rel="noreferrer">
                        <ShieldCheck className="inline h-4 w-4 mr-1" /> {doc.title || `Legal Document ${idx + 1}`}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No legal documents uploaded.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* 10. SEO Metadata */}
        {isPortfolioTour && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                {PROJECT_SECTIONS.seo.label}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditSection(PROJECT_SECTIONS.seo.slug)}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 pt-2 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">
                  Meta Title:
                </span>{" "}
                {project.seo?.metaTitle || "N/A"}
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  Meta Description:
                </span>{" "}
                {project.seo?.metaDescription || "N/A"}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Child Projects Dropdown (Only for Portfolio Tours) */}
        {isPortfolioTour && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Included Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2 text-sm">
              <p className="text-muted-foreground">
                Select a project inside this tour to view its details.
              </p>
              {childProjects.length > 0 ? (
                <Select onValueChange={(val) => navigate(ROUTES.PROJECT_VIEW.replace(":id", val))}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="View sub-project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {childProjects.map((cp) => (
                      <SelectItem key={cp._id} value={cp._id}>
                        {cp.general?.projectName || "Untitled"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-muted-foreground italic">No projects added yet.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
