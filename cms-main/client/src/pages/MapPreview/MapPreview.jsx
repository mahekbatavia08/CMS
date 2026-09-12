import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import projectService from "@/services/project/projectService";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "").replace(/\/$/, "");

export default function MapPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [childProjects, setChildProjects] = useState([]);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (id) {
      projectService
        .getProject(id)
        .then(async (res) => {
          const projectData = res.data?.project || res.project || res.data;
          setProject(projectData);

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
          }
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
        if (location.state?.from) {
          navigate(location.state.from);
        } else {
          navigate(ROUTES.PROJECTS_MASTER);
        }
      } else if (e.data?.type === "GET_PROJECT_DATA") {
        sendProjectToIframe();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [id, navigate, project, childProjects, location.state]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0a0a12] p-0 m-0 border-0">
      <iframe
        ref={iframeRef}
        src="/map-template.html"
        title="Map UI Template - Property Explorer"
        className="w-full h-full border-0 block"
        style={{ width: "100%", height: "100%", border: "none" }}
        onLoad={sendProjectToIframe}
      />
    </div>
  );
}
