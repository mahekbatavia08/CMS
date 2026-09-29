import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import projectService from "@/services/project/projectService";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "").replace(/\/$/, "");
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export default function MapPreview() {
  const navigate = useNavigate();
  const { id } = useParams();
  const locationState = useLocation().state;
  const backTo = locationState?.backTo;
  // Opened as "Individual Map Skin" (SkinPreviewMenu): show a master's
  // project on its own, without the master's navigation or About Us fallback.
  const standalone = Boolean(locationState?.standalone);
  const [project, setProject] = useState(null);
  const [childProjects, setChildProjects] = useState([]);
  // Ids of all projects in the same master, in the master's list order
  // (drives the skin's prev/next title arrows).
  const [siblingIds, setSiblingIds] = useState([]);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (id) {
      projectService
        .getProject(id)
        .then(async (res) => {
          let projectData = res.data?.project || res.project || res.data;

          // If this is a portfolio tour / master project, load all associated child projects
          if (projectData?.projectCategory === "portfolio" || id === "master") {
            try {
              const childRes = await projectService.getProjects({
                limit: 1000,
                parentProject: id === "master" ? undefined : id,
              });
              const list = childRes.data?.items || childRes.data?.projects || childRes.items || childRes.projects || [];
              setChildProjects(list);
            } catch (err) {
              console.error("Failed to load child projects for portfolio:", err);
            }
          } else {
            // For single individual project
            setChildProjects([projectData]);

            // Fall back to the parent master project's About Us details
            // (contact/social links, location, logo) for any field the
            // individual project hasn't filled in itself.
            const parentId = standalone
              ? null
              : typeof projectData?.parentProject === "object"
                ? projectData.parentProject?._id
                : projectData?.parentProject;

            setSiblingIds([]);
            if (parentId) {
              try {
                const siblingRes = await projectService.getProjects({
                  parentProject: parentId,
                  limit: 1000,
                });
                const siblings = siblingRes.data?.items || siblingRes.data?.projects || siblingRes.items || siblingRes.projects || [];
                setSiblingIds(siblings.map((s) => s._id).filter(Boolean));
              } catch (err) {
                console.error("Failed to load sibling projects:", err);
              }

              try {
                const parentRes = await projectService.getProject(parentId);
                const parent = parentRes.data?.project || parentRes.project || parentRes.data;

                if (parent) {
                  const fallback = (own = {}, fromParent = {}) => {
                    const merged = { ...own };
                    Object.keys(fromParent || {}).forEach((key) => {
                      if (!merged[key]) merged[key] = fromParent[key];
                    });
                    return merged;
                  };

                  projectData = {
                    ...projectData,
                    contact: {
                      ...fallback(projectData.contact, parent.contact),
                      // The YouTube link is portfolio-level branding (edited on the
                      // master project only), not a per-project value, so always use
                      // the parent's current link instead of an individual project's
                      // own copy, which can be a stale value left over from import.
                      ...(parent.contact?.youtube
                        ? { youtube: parent.contact.youtube }
                        : {}),
                    },
                    location: fallback(projectData.location, parent.location),
                    media: {
                      ...projectData.media,
                      thumbnailImage: projectData.media?.thumbnailImage?.url ? projectData.media.thumbnailImage : parent.media?.thumbnailImage,
                    },
                  };
                }
              } catch (err) {
                console.error("Failed to load parent master project for About Us fallback:", err);
              }
            }
          }

          setProject(projectData);
        })
        .catch(console.error);
    }
  }, [id, standalone]);

  const sendProjectToIframe = () => {
    if (iframeRef.current && iframeRef.current.contentWindow && project) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "INIT_PROJECT_DATA",
          project,
          childProjects: childProjects.length > 0 ? childProjects : [project],
          siblingNav: siblingIds.length > 1 && siblingIds.includes(project._id),
          apiBase: API_BASE,
          googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        },
        "*"
      );
    }
  };

  useEffect(() => {
    sendProjectToIframe();
  }, [project, childProjects, siblingIds]);

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data?.type === "GO_BACK_TO_MAP_SKIN" || e.data?.type === "GO_BACK") {
        // Exit the project entirely (never to the Map Skin page): return to
        // the list the preview was opened from, or else the list the
        // project belongs to. Router history isn't relied on because it
        // isn't reliably set depending on how this preview was reached.
        const parentId = typeof project?.parentProject === "object"
          ? project.parentProject?._id
          : project?.parentProject;

        let exitTo = ROUTES.PROJECTS_INDIVIDUAL;
        if (id === "master" || project?.projectCategory === "portfolio") {
          exitTo = ROUTES.PROJECTS_MASTER;
        } else if (parentId) {
          exitTo = ROUTES.PROJECTS_PORTFOLIO_DETAIL.replace(":portfolioId", parentId);
        }

        navigate(backTo || exitTo);
      } else if (e.data?.type === "OPEN_PROJECT" && e.data.projectId) {
        // A pin / gallery card on the master skin: open that project's
        // individual map skin; its Back button returns to this master skin.
        navigate(ROUTES.PROJECT_MAP_PREVIEW.replace(":id", e.data.projectId), {
          state: { backTo: ROUTES.PROJECT_MAP_PREVIEW.replace(":id", id) },
        });
      } else if (e.data?.type === "OPEN_SIBLING_PROJECT") {
        // Title arrows on a master's individual skin: step through the
        // master's projects in list order (wrapping), keeping the same Back.
        const n = siblingIds.length;
        const current = siblingIds.indexOf(project?._id);
        if (n < 2 || current === -1) return;
        const nextId = siblingIds[(current + (e.data.direction < 0 ? -1 : 1) + n) % n];
        navigate(ROUTES.PROJECT_MAP_PREVIEW.replace(":id", nextId), {
          replace: true,
          state: locationState,
        });
      } else if (e.data?.type === "GET_PROJECT_DATA") {
        sendProjectToIframe();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [id, backTo, navigate, project, childProjects, siblingIds, locationState]);

  // The skin follows the project type only: master portfolios keep the
  // original map template, every individual project (standalone or inside
  // a master) uses the individual map skin.
  const isPortfolio = id === "master" || project?.projectCategory === "portfolio";
  const skinSrc = isPortfolio ? "/map-template.html" : "/individual-mapskin.html";

  if (!project) {
    return <div className="w-screen h-screen bg-[#0a0a12]" />;
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0a0a12] p-0 m-0 border-0">
      <iframe
        key={skinSrc}
        ref={iframeRef}
        src={skinSrc}
        title="Map UI Template - Property Explorer"
        className="w-full h-full border-0 block"
        style={{ width: "100%", height: "100%", border: "none" }}
        allow="autoplay; encrypted-media; fullscreen"
        onLoad={sendProjectToIframe}
      />
    </div>
  );
}
