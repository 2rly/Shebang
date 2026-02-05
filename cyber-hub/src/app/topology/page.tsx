"use client";

import dynamic from "next/dynamic";
import { Network } from "lucide-react";

// Dynamic import with SSR: false - CRITICAL
// Excalidraw uses window/document APIs that don't exist on server
const ExcalidrawWrapper = dynamic(
  () => import("@/components/topology/ExcalidrawWrapper"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: "calc(100vh - 64px)",
          width: "100%",
          backgroundColor: "#1e1e1e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                border: "4px solid rgba(165, 216, 255, 0.3)",
                borderTopColor: "#a5d8ff",
                borderRadius: "50%",
                animation: "excalidraw-spin 1s linear infinite",
              }}
            />
            <Network
              style={{
                width: "32px",
                height: "32px",
                color: "#a5d8ff",
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>
          <p
            style={{
              color: "#868e96",
              fontSize: "14px",
              fontFamily: "monospace",
            }}
          >
            Loading <span style={{ color: "#a5d8ff" }}>Excalidraw</span>...
          </p>
        </div>
        <style>{`
          @keyframes excalidraw-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    ),
  }
);

export default function TopologyPage() {
  return (
    <div
      className="excalidraw-container"
      style={{
        height: "calc(100vh - 64px)",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <ExcalidrawWrapper />
    </div>
  );
}
