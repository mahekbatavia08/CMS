import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import projectService from "@/services/project/projectService";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "").replace(/\/$/, "");
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export default function MapPreview() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [childProjects, setChildProjects] = useState([]);
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
            const parentId = typeof projectData?.parentProject === "object"
              ? projectData.parentProject?._id
              : projectData?.parentProject;

            if (parentId) {
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
                    contact: fallback(projectData.contact, parent.contact),
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
  }, [id]);

  const sendProjectToIframe = () => {
    if (iframeRef.current && iframeRef.current.contentWindow && project) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "INIT_PROJECT_DATA",
          project,
          childProjects: childProjects.length > 0 ? childProjects : [project],
          apiBase: API_BASE,
          googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        },
        "*"
      );
    }
  };

  useEffect(() => {
    sendProjectToIframe();
  }, [project, childProjects]);

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data?.type === "GO_BACK_TO_MAP_SKIN" || e.data?.type === "GO_BACK") {
        // Always return to this project's own Map Skin page instead of
        // relying on browser/router history, which isn't reliably set
        // depending on how this preview was reached.
        navigate(ROUTES.PROJECT_MAP_SKIN.replace(":id", id));
      } else if (e.data?.type === "GET_PROJECT_DATA") {
        sendProjectToIframe();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [id, navigate, project, childProjects]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0a0a12] p-0 m-0 border-0">
      <iframe
        ref={iframeRef}
        src="/map-template.html"
        title="Map UI Template - Property Explorer"
        className="w-full h-full border-0 block"
        style={{ width: "100%", height: "100%", border: "none" }}
        allow="autoplay; encrypted-media; fullscreen"
        onLoad={sendProjectToIframe}
      />
    </div>
  );
}
