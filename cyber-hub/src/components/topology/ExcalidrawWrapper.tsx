"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { createLibraryItems } from "@/data/network-devices";

const STORAGE_KEY = "netsentinel-topology-data";

function loadSavedTopology() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return {
        elements: data.elements || [],
        appState: {
          ...(data.appState || {}),
          viewBackgroundColor: "#0a0a0f",
        },
        files: data.files || undefined,
      };
    }
  } catch {}
  return {
    elements: [],
    appState: { viewBackgroundColor: "#0a0a0f" },
  };
}

export default function ExcalidrawWrapper() {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [initialData] = useState(loadSavedTopology);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout>>();

  // Auto-save on every change (debounced 2s)
  const handleChange = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
      autoSaveRef.current = setTimeout(() => {
        try {
          const filtered = [...elements].filter((el: any) => !el.isDeleted);
          const data = JSON.stringify({
            type: "excalidraw",
            version: 2,
            elements: filtered,
            appState: {
              viewBackgroundColor: appState.viewBackgroundColor,
            },
            files: files || {},
          });
          localStorage.setItem(STORAGE_KEY, data);
        } catch {}
      }, 2000);
    },
    []
  );

  // Pre-load network device shapes into Excalidraw's native library
  useEffect(() => {
    if (!excalidrawAPI) return;
    try {
      excalidrawAPI.updateLibrary({
        libraryItems: createLibraryItems(),
        merge: true,
      });
    } catch {}
  }, [excalidrawAPI]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, []);

  return (
    <div className="excalidraw-container" style={{ width: "100%", height: "100%" }}>
      <Excalidraw
        theme="dark"
        excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
        initialData={initialData}
        onChange={handleChange}
      />
    </div>
  );
}
