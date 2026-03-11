"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

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

function TopologyContent() {
  const searchParams = useSearchParams();
  const fileUrl = searchParams.get("file");

  return (
    <div style={{ height: "calc(100vh - 64px)", width: "100%", overflow: "hidden" }}>
      <ExcalidrawWrapper fileUrl={fileUrl || undefined} />
    </div>
  );
}

export default function TopologyPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full w-full items-center justify-center bg-cyber-bg">
        <div className="h-12 w-12 rounded-full border-4 border-cyber-primary/20 border-t-cyber-primary animate-spin" />
      </div>
    }>
      <TopologyContent />
    </Suspense>
  );
}
