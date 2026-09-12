import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MapPin, Navigation, Layers, Compass } from "lucide-react";

const MapPreviewModal = ({ open, onOpenChange, project }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const projectName = project?.general?.projectName || "Sample Project";
  const city = project?.location?.city || "Ahmedabad";
  const state = project?.location?.state || "Gujarat";
  const address = project?.location?.address || "";

  useEffect(() => {
    if (!open) return;

    // Default coordinates (Ahmedabad center or standard preview coordinate)
    const defaultCoords = [23.0225, 72.5714];

    // Give the modal animation a moment to render before Leaflet calculates container size
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      // Clean up any existing map instance on re-opening
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      try {
        const map = L.map(mapContainerRef.current, {
          center: defaultCoords,
          zoom: 13,
          zoomControl: false,
          scrollWheelZoom: true,
        });

        // Add zoom control at bottom right
        L.control.zoom({ position: "bottomright" }).addTo(map);

        // Standard Default Map Skin Tile Layer (CartoDB Voyager - clean, modern vector map style)
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: "abcd",
            maxZoom: 20,
          }
        ).addTo(map);

        // Custom stylized marker pin
        const customPinIcon = L.divIcon({
          className: "custom-leaflet-marker",
          html: `
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 38px;
              height: 38px;
              border-radius: 50%;
              background: #0f172a;
              color: #ffffff;
              box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
              border: 3px solid #ffffff;
              cursor: pointer;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 38],
          popupAnchor: [0, -38],
        });

        const marker = L.marker(defaultCoords, { icon: customPinIcon }).addTo(map);

        const popupContent = `
          <div style="font-family: inherit; padding: 4px 2px; min-width: 170px;">
            <div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 2px;">
              ${projectName}
            </div>
            <div style="font-size: 12px; color: #64748b; line-height: 1.3;">
              ${address ? `${address}, ` : ""}${city}${state ? `, ${state}` : ""}
            </div>
            <div style="margin-top: 6px; font-size: 11px; font-weight: 600; color: #059669; display: flex; align-items: center; gap: 4px;">
              ● Default Map Skin Active
            </div>
          </div>
        `;

        marker.bindPopup(popupContent).openPopup();

        mapInstanceRef.current = map;

        // Invalidate size to ensure full container tile coverage
        setTimeout(() => {
          map.invalidateSize();
        }, 150);
      } catch (err) {
        console.error("Error initializing Leaflet preview map:", err);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [open, projectName, city, state, address]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] p-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Map Preview
              </DialogTitle>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Default Map Skin
              </span>
            </div>
            <DialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Live interactive preview showing map tiles, navigation controls, and location markers.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Map Container Area */}
        <div className="relative w-full h-[400px] sm:h-[500px] bg-slate-100 dark:bg-slate-950">
          {/* Leaflet Map DOM Element */}
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating Map Status Overlay Badge */}
          <div className="absolute top-3 left-3 z-[400] flex items-center gap-2 rounded-lg bg-white/95 dark:bg-slate-900/95 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-md backdrop-blur border border-slate-200 dark:border-slate-800">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>Skin: <strong>Default</strong></span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <Compass className="h-3.5 w-3.5 text-slate-500" />
            <span>Interactive View</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MapPreviewModal;
