"use client";

import dynamic from "next/dynamic";
import { Network } from "lucide-react";

// Dynamic import with SSR disabled — CRITICAL
// Excalidraw depends on window/document APIs that don't exist during SSR
const ExcalidrawWrapper = dynamic(
  () => import("@/components/topology/ExcalidrawWrapper"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: "calc(100vh - 64px)",
          width: "100%",
          backgroundColor: "#0a0a0f",
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
                border: "4px solid rgba(0, 255, 157, 0.2)",
                borderTopColor: "#00ff9d",
                borderRadius: "50%",
                animation: "excalidraw-spin 1s linear infinite",
              }}
            />
            <Network
              style={{
                width: "32px",
                height: "32px",
                color: "#00ff9d",
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>
          <p
            style={{
              color: "#71717a",
              fontSize: "13px",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.5px",
            }}
          >
            Loading{" "}
            <span style={{ color: "#00ff9d" }}>NetSentinel</span>...
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
