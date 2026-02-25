"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Excalidraw,
  MainMenu,
  WelcomeScreen,
  useHandleLibrary,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { createLibraryItems } from "@/data/network-devices";

/* ─── Storage keys ─── */
const SCENE_KEY = "shebang-topology";
const LIBRARY_KEY = "shebang-topology-library";
const FILES_KEY = "shebang-topology-files";

/* ─── Stable default library items (created once per session) ─── */
let _defaultLibraryItems: ReturnType<typeof createLibraryItems> | null = null;
function getDefaultLibraryItems() {
  if (!_defaultLibraryItems) {
    _defaultLibraryItems = createLibraryItems();
  }
  return _defaultLibraryItems;
}

/* ─── Merge defaults with persisted user items ─── */
function mergeWithDefaults(persisted: any[]): any[] {
  const defaults = getDefaultLibraryItems();
  const persistedIds = new Set(persisted.map((item: any) => item.id));
  return [
    ...defaults.filter((d) => !persistedIds.has(d.id)),
    ...persisted,
  ];
}

/* ─── Load saved scene from localStorage ─── */
function loadSavedScene() {
  try {
    const saved = localStorage.getItem(SCENE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      // Migrate old dark backgrounds to white
      const bg = data.appState?.viewBackgroundColor;
      const bgColor =
        bg && bg !== "#0a0a0f" && bg !== "#12121a" ? bg : "#ffffff";
      return {
        elements: data.elements || [],
        appState: {
          ...(data.appState || {}),
          viewBackgroundColor: bgColor,
        },
        files: data.files || undefined,
      };
    }
  } catch {}
  return {
    elements: [],
    appState: {
      viewBackgroundColor: "#ffffff",
      showWelcomeScreen: true,
    },
  };
}

/* ─── LibraryPersistenceAdapter (v0.18.0 signature) ─── */
const libraryAdapter = {
  load(_metadata: { source: "load" | "save" }) {
    try {
      const raw = localStorage.getItem(LIBRARY_KEY);
      if (raw) {
        const items = JSON.parse(raw);
        if (Array.isArray(items) && items.length > 0) {
          return { libraryItems: mergeWithDefaults(items) };
        }
      }
    } catch {}
    return { libraryItems: getDefaultLibraryItems() };
  },
  save(libraryData: { libraryItems: readonly any[] }) {
    try {
      localStorage.setItem(
        LIBRARY_KEY,
        JSON.stringify(libraryData.libraryItems),
      );
    } catch {}
  },
};

export default function ExcalidrawWrapper() {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [initialData] = useState(loadSavedScene);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout>>();

  /* ─── Library persistence ─── */
  useHandleLibrary({
    excalidrawAPI,
    adapter: libraryAdapter,
  } as any);

  /* ─── Auto-save scene to localStorage (debounced 2s) ─── */
  const handleChange = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
      autoSaveRef.current = setTimeout(() => {
        try {
          const filtered = [...elements].filter((el: any) => !el.isDeleted);
          localStorage.setItem(
            SCENE_KEY,
            JSON.stringify({
              type: "excalidraw",
              version: 2,
              elements: filtered,
              appState: {
                viewBackgroundColor: appState.viewBackgroundColor,
                gridSize: appState.gridSize,
              },
              files: files || {},
            }),
          );
          if (files && Object.keys(files).length > 0) {
            localStorage.setItem(FILES_KEY, JSON.stringify(files));
          }
        } catch {}
      }, 2000);
    },
    [],
  );

  /* ─── Cleanup timers on unmount ─── */
  useEffect(() => {
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, []);

  return (
    <div
      className="excalidraw-container"
      style={{ width: "100%", height: "100%" }}
    >
      <Excalidraw
        excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
        initialData={initialData}
        onChange={handleChange}
        theme="light"
        name="shebang.az Topology"
        detectScroll={true}
        handleKeyboardGlobally={true}
        autoFocus={true}
        UIOptions={{
          canvasActions: {
            loadScene: true,
            saveToActiveFile: true,
            toggleTheme: true,
            saveAsImage: true,
            export: { saveFileToDisk: true },
            clearCanvas: true,
            changeViewBackgroundColor: true,
          },
          tools: {
            image: true,
          },
        }}
      >
        {/* ── Welcome Screen with shebang.az branding ── */}
        <WelcomeScreen>
          <WelcomeScreen.Hints.MenuHint />
          <WelcomeScreen.Hints.ToolbarHint />
          <WelcomeScreen.Hints.HelpHint />
          <WelcomeScreen.Center>
            <WelcomeScreen.Center.Logo>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#228be6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="1" width="22" height="22" rx="4" />
                  <line x1="6" y1="12" x2="18" y2="12" />
                  <line x1="12" y1="6" x2="12" y2="18" />
                  <circle cx="6" cy="6" r="1.5" fill="#228be6" />
                  <circle cx="18" cy="6" r="1.5" fill="#228be6" />
                  <circle cx="6" cy="18" r="1.5" fill="#228be6" />
                  <circle cx="18" cy="18" r="1.5" fill="#228be6" />
                </svg>
                <div style={{ textAlign: "center" }}>
                  <h1 style={{ fontSize: 28, fontWeight: "bold", fontFamily: "monospace", margin: 0, lineHeight: 1.2 }}>
                    <span style={{ color: "#228be6" }}>#!</span>
                    <span style={{ color: "#1a1a2e" }}>shebang</span>
                    <span style={{ color: "#868e96" }}>.az</span>
                  </h1>
                  <p style={{ fontSize: 12, color: "#868e96", margin: "4px 0 0 0", fontFamily: "monospace" }}>
                    Network Topology Designer
                  </p>
                </div>
              </div>
            </WelcomeScreen.Center.Logo>
            <WelcomeScreen.Center.Heading>
              Create network topology diagrams
            </WelcomeScreen.Center.Heading>
            <WelcomeScreen.Center.Menu>
              <WelcomeScreen.Center.MenuItemLoadScene />
              <WelcomeScreen.Center.MenuItemHelp />
            </WelcomeScreen.Center.Menu>
          </WelcomeScreen.Center>
        </WelcomeScreen>

        {/* ── Full Main Menu ── */}
        <MainMenu>
          <MainMenu.DefaultItems.LoadScene />
          <MainMenu.DefaultItems.SaveToActiveFile />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.Separator />
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.Separator />
          <MainMenu.DefaultItems.ToggleTheme />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
          <MainMenu.Separator />
          <MainMenu.DefaultItems.Help />
          <MainMenu.Separator />
          <MainMenu.Item
            onSelect={() => {
              window.open("https://libraries.excalidraw.com/", "_blank");
            }}
          >
            Browse Libraries
          </MainMenu.Item>
        </MainMenu>
      </Excalidraw>
    </div>
  );
}
