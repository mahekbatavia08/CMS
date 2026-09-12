import React, { useState, useEffect } from "react";
import { Loader2, MapPin } from "lucide-react";

const AutoMapThumbnail = ({ project }) => {
  const [isLoading, setIsLoading] = useState(true);

  const projectName = project?.general?.projectName || "Sample Project";
  const city = project?.location?.city || "Ahmedabad";

  useEffect(() => {
    // Smooth transition from loading to ready
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-[#0a0a12] border-b border-slate-200 dark:border-slate-800 select-none">
      {/* Loading State - guaranteed to resolve */}
      {isLoading ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-[#0a0a12] text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-[#3D8EFF]" />
          <span className="text-xs font-medium">Generating preview...</span>
        </div>
      ) : (
        /* Actual Map UI Template Visual Preview */
        <div className="relative w-full h-full group overflow-hidden">
          {/* Stylized Grid & Radials from the actual Map UI Template */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 30% 20%, rgba(61,142,255,0.14), transparent 45%), radial-gradient(circle at 75% 70%, rgba(61,142,255,0.10), transparent 40%), repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 28px), repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 28px), linear-gradient(160deg, #14171f 0%, #0c0e13 100%)",
            }}
          />

          {/* SVG Map Networks & Features */}
          <svg
            className="absolute inset-0 w-full h-full object-cover"
            viewBox="0 0 600 340"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Water Body */}
            <path
              d="M0 240 Q150 180 300 220 T600 160 L600 340 L0 340 Z"
              className="fill-sky-950/40"
            />

            {/* Primary Arterial Road */}
            <path
              d="M-20 60 L620 280"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M-20 60 L620 280"
              stroke="#1e293b"
              strokeWidth="8"
              strokeLinecap="round"
            />

            {/* Secondary Arterial Curve */}
            <path
              d="M180 -20 Q220 180 420 360"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="10"
            />
            <path
              d="M180 -20 Q220 180 420 360"
              stroke="#1e293b"
              strokeWidth="6"
            />

            {/* Grid Line Networks */}
            <path
              d="M60 0 V340 M140 0 V340 M300 0 V340 M380 0 V340 M500 0 V340"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="2"
            />
            <path
              d="M0 50 H600 M0 120 H600 M0 190 H600 M0 260 H600"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="2"
            />

            {/* Urban Parks */}
            <rect
              x="70"
              y="70"
              width="80"
              height="70"
              rx="6"
              className="fill-emerald-950/40 stroke-emerald-800/40"
            />
            <rect
              x="440"
              y="40"
              width="100"
              height="55"
              rx="6"
              className="fill-emerald-950/40 stroke-emerald-800/40"
            />

            {/* Urban Blocks */}
            <rect x="190" y="60" width="60" height="35" rx="4" className="fill-slate-800/60" />
            <rect x="280" y="110" width="55" height="30" rx="4" className="fill-slate-800/60" />
            <rect x="360" y="50" width="55" height="40" rx="4" className="fill-slate-800/60" />

            {/* Central Project Location Marker with Pulse */}
            <g transform="translate(300, 160)">
              <circle cx="0" cy="0" r="28" className="fill-[#3D8EFF]/15 animate-ping" />
              <circle cx="0" cy="0" r="14" className="fill-[#3D8EFF]/30" />
              <circle cx="0" cy="0" r="6" className="fill-[#3D8EFF]" />
            </g>
          </svg>

          {/* Location Pin Badge with Project Name */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[42px] z-10 flex flex-col items-center">
            <div className="bg-black/90 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-2xl border border-white/20 flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-[#3D8EFF]" />
              <span>{projectName}</span>
            </div>
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-black/90" />
          </div>

          {/* Landmarks Mock */}
          <div className="absolute top-8 left-16 text-sm drop-shadow">🏫</div>
          <div className="absolute bottom-10 right-16 text-sm drop-shadow">🏥</div>
          <div className="absolute top-10 right-20 text-sm drop-shadow">🛍️</div>

          {/* Top Left Floating Badge */}
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 rounded-md bg-black/80 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur-md border border-white/15">
            <MapPin className="h-3 w-3 text-[#3D8EFF]" />
            <span>Map Preview</span>
          </div>

          {/* Bottom View Toolbar Preview */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 text-[10px] text-white/80">
            <span className="bg-white text-black px-2 py-0.5 rounded font-semibold">Map</span>
            <span className="px-2 py-0.5 text-white/60">Gallery</span>
            <span className="px-2 py-0.5 text-white/60">Filter</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoMapThumbnail;
