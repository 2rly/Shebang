"use client";

import dynamic from "next/dynamic";

const ExcalidrawWrapper = dynamic(
  () => import("@/components/topology/ExcalidrawWrapper"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-cyber-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-cyber-primary/20 border-t-cyber-primary animate-spin" />
          <p className="font-mono text-sm text-cyber-muted tracking-wide">
            Loading Excalidraw...
          </p>
        </div>
      </div>
    ),
  }
);

export default function TopologyPage() {
  return (
    <div style={{ height: "calc(100vh - 64px)", width: "100%", overflow: "hidden" }}>
      <ExcalidrawWrapper />
    </div>
  );
}
