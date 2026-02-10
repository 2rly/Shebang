"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import {
  Save,
  Upload,
  FileJson,
  Image as ImageIcon,
  Network,
  RotateCcw,
} from "lucide-react";

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
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [initialData] = useState(loadSavedTopology);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const autoSaveRef = useRef<ReturnType<typeof setTimeout>>();

  const showStatus = useCallback((msg: string) => {
    setSaveStatus(msg);
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    statusTimeoutRef.current = setTimeout(() => setSaveStatus(null), 2500);
  }, []);

  // Serialize current scene to JSON string
  const serializeScene = useCallback(() => {
    if (!excalidrawAPI) return null;
    const elements = excalidrawAPI
      .getSceneElements()
      .filter((el: any) => !el.isDeleted);
    const appState = excalidrawAPI.getAppState();
    const files = excalidrawAPI.getFiles();
    return JSON.stringify({
      type: "excalidraw",
      version: 2,
      elements,
      appState: {
        viewBackgroundColor: appState.viewBackgroundColor,
        gridSize: appState.gridSize,
      },
      files: files || {},
    });
  }, [excalidrawAPI]);

  // Save to localStorage
  const handleSave = useCallback(() => {
    const data = serializeScene();
    if (!data) return;
    try {
      localStorage.setItem(STORAGE_KEY, data);
      showStatus("Topology saved");
    } catch {
      showStatus("Save failed");
    }
  }, [serializeScene, showStatus]);

  // Auto-save on change (3s debounce)
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
      }, 3000);
    },
    []
  );

  // Export as PNG
  const handleExportPNG = useCallback(async () => {
    if (!excalidrawAPI) return;
    try {
      const { exportToBlob } = await import("@excalidraw/excalidraw");
      const blob = await exportToBlob({
        elements: excalidrawAPI.getSceneElements(),
        appState: {
          ...excalidrawAPI.getAppState(),
          exportWithDarkMode: true,
          exportBackground: true,
        },
        files: excalidrawAPI.getFiles(),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "network-topology.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showStatus("PNG exported");
    } catch {
      showStatus("Export failed");
    }
  }, [excalidrawAPI, showStatus]);

  // Export as JSON (.excalidraw)
  const handleExportJSON = useCallback(() => {
    const data = serializeScene();
    if (!data) return;
    try {
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "network-topology.excalidraw";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showStatus("JSON exported");
    } catch {
      showStatus("Export failed");
    }
  }, [serializeScene, showStatus]);

  // Import from file
  const handleImport = useCallback(() => {
    if (!excalidrawAPI) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.excalidraw";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        excalidrawAPI.updateScene({
          elements: data.elements || [],
        });
        if (data.files && typeof excalidrawAPI.addFiles === "function") {
          excalidrawAPI.addFiles(Object.values(data.files));
        }
        showStatus("File imported");
      } catch {
        showStatus("Import failed");
      }
    };
    input.click();
  }, [excalidrawAPI, showStatus]);

  // Clear canvas
  const handleClear = useCallback(() => {
    if (!excalidrawAPI) return;
    if (!window.confirm("Clear the entire canvas? This cannot be undone."))
      return;
    excalidrawAPI.resetScene();
    excalidrawAPI.updateScene({
      appState: { viewBackgroundColor: "#0a0a0f" },
    });
    localStorage.removeItem(STORAGE_KEY);
    showStatus("Canvas cleared");
  }, [excalidrawAPI, showStatus]);

  // Ctrl+S keyboard shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleSave]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: "#0a0a0f",
      }}
    >
      {/* Header Toolbar */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          background: "#12121a",
          borderBottom: "1px solid #1e1e2e",
          gap: "16px",
        }}
      >
        {/* Title section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              flexShrink: 0,
              background: "rgba(0, 255, 157, 0.1)",
              border: "1px solid rgba(0, 255, 157, 0.3)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Network
              style={{ width: "20px", height: "20px", color: "#00ff9d" }}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 600,
                color: "#e4e4e7",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.5px",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ color: "#00ff9d" }}>NetSentinel</span>
              <span style={{ color: "#71717a", margin: "0 8px" }}>—</span>
              <span>Network Topology Designer</span>
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "11px",
                color: "#71717a",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Design your network topology using the tools below
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
          }}
        >
          {saveStatus && (
            <span
              style={{
                fontSize: "11px",
                color: saveStatus.includes("failed")
                  ? "#ff006e"
                  : "#00ff9d",
                fontFamily: "'JetBrains Mono', monospace",
                marginRight: "6px",
                whiteSpace: "nowrap",
              }}
            >
              {saveStatus}
            </span>
          )}

          <ToolbarButton
            onClick={handleSave}
            icon={<Save style={{ width: 14, height: 14 }} />}
            label="Save"
            hoverColor="#00ff9d"
            title="Save to browser (Ctrl+S)"
          />
          <ToolbarButton
            onClick={handleImport}
            icon={<Upload style={{ width: 14, height: 14 }} />}
            label="Import"
            hoverColor="#00d4ff"
            title="Import .excalidraw or .json file"
          />

          <Divider />

          <ToolbarButton
            onClick={handleExportPNG}
            icon={<ImageIcon style={{ width: 14, height: 14 }} />}
            label="PNG"
            hoverColor="#00d4ff"
            title="Export as PNG image"
          />
          <ToolbarButton
            onClick={handleExportJSON}
            icon={<FileJson style={{ width: 14, height: 14 }} />}
            label="JSON"
            hoverColor="#00d4ff"
            title="Export as .excalidraw JSON"
          />

          <Divider />

          <ToolbarButton
            onClick={handleClear}
            icon={<RotateCcw style={{ width: 14, height: 14 }} />}
            label="Clear"
            hoverColor="#ff006e"
            defaultBorder="rgba(255, 0, 110, 0.3)"
            title="Clear entire canvas"
          />
        </div>
      </div>

      {/* Excalidraw Canvas — isolated with excalidraw-container CSS reset */}
      <div
        className="excalidraw-container"
        style={{ flex: 1, minHeight: 0, height: "auto" }}
      >
        <Excalidraw
          theme="dark"
          excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
          initialData={initialData}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}

/* ── Toolbar sub-components ── */

function ToolbarButton({
  onClick,
  icon,
  label,
  hoverColor,
  defaultBorder = "#1e1e2e",
  title,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hoverColor: string;
  defaultBorder?: string;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        background: "#12121a",
        border: `1px solid ${defaultBorder}`,
        color: "#a1a1aa",
        borderRadius: "6px",
        fontSize: "12px",
        fontFamily: "'JetBrains Mono', monospace",
        cursor: "pointer",
        transition: "all 0.2s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = hoverColor;
        e.currentTarget.style.color = hoverColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = defaultBorder;
        e.currentTarget.style.color = "#a1a1aa";
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function Divider() {
  return (
    <div
      style={{
        width: "1px",
        height: "24px",
        background: "#1e1e2e",
        margin: "0 4px",
      }}
    />
  );
}
