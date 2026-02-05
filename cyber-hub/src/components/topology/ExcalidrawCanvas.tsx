"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
  LibraryItems,
} from "@excalidraw/excalidraw/types/types";
import { Network } from "lucide-react";

const STORAGE_KEY = "shebang-topology";
const LIBRARY_KEY = "shebang-topology-library";
const FILES_KEY = "shebang-topology-files";

export default function ExcalidrawCanvas() {
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const [isClient, setIsClient] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load saved data when API is ready
  useEffect(() => {
    if (!excalidrawAPI) return;

    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedFiles = localStorage.getItem(FILES_KEY);

    if (savedData) {
      try {
        const { elements, appState } = JSON.parse(savedData);
        const files = savedFiles ? JSON.parse(savedFiles) : {};
        excalidrawAPI.updateScene({ elements, appState });
        if (Object.keys(files).length > 0) {
          excalidrawAPI.addFiles(Object.values(files));
        }
      } catch (e) {
        console.error("Failed to load saved topology:", e);
      }
    }

    // Load library items
    const savedLibrary = localStorage.getItem(LIBRARY_KEY);
    if (savedLibrary) {
      try {
        const libraryItems = JSON.parse(savedLibrary);
        excalidrawAPI.updateLibrary({ libraryItems, merge: true });
      } catch (e) {
        console.error("Failed to load library:", e);
      }
    }
  }, [excalidrawAPI]);

  // Debounced auto-save to localStorage
  const handleChange = useCallback(
    (
      elements: readonly ExcalidrawElement[],
      appState: AppState,
      files: BinaryFiles
    ) => {
      // Clear previous timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce saves to avoid performance issues
      saveTimeoutRef.current = setTimeout(() => {
        const data = JSON.stringify({
          elements,
          appState: {
            viewBackgroundColor: appState.viewBackgroundColor,
            gridSize: appState.gridSize,
            currentItemFontFamily: appState.currentItemFontFamily,
            zoom: appState.zoom,
            scrollX: appState.scrollX,
            scrollY: appState.scrollY,
          },
        });
        localStorage.setItem(STORAGE_KEY, data);

        // Save files (images, etc.)
        if (Object.keys(files).length > 0) {
          localStorage.setItem(FILES_KEY, JSON.stringify(files));
        }
      }, 300);
    },
    []
  );

  // Save library items when they change
  const handleLibraryChange = useCallback((items: LibraryItems) => {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(items));
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!isClient) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#121212]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#a5d8ff]/30 border-t-[#a5d8ff] rounded-full animate-spin" />
          <span className="text-[#868e96] text-sm">Loading Excalidraw...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        onChange={handleChange}
        onLibraryChange={handleLibraryChange}
        theme="dark"
        name="shebang.az Topology"
        UIOptions={{
          canvasActions: {
            loadScene: true,
            saveAsImage: true,
            export: {
              saveFileToDisk: true,
            },
            clearCanvas: true,
            changeViewBackgroundColor: true,
            toggleTheme: true,
          },
          tools: {
            image: true,
          },
        }}
        initialData={{
          appState: {
            viewBackgroundColor: "#121212",
            showWelcomeScreen: true,
          },
        }}
        langCode="en"
      >
        {/* Custom Welcome Screen with shebang.az branding */}
        <WelcomeScreen>
          <WelcomeScreen.Hints.MenuHint />
          <WelcomeScreen.Hints.ToolbarHint />
          <WelcomeScreen.Hints.HelpHint />
          <WelcomeScreen.Center>
            <WelcomeScreen.Center.Logo>
              <div className="flex items-center justify-center gap-3">
                <Network className="w-10 h-10" style={{ color: "#a5d8ff" }} />
                <div className="text-center">
                  <h1
                    style={{
                      fontSize: "28px",
                      fontWeight: "bold",
                      fontFamily: "monospace",
                      margin: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    <span style={{ color: "#a5d8ff" }}>#!</span>
                    <span style={{ color: "#fff" }}>shebang</span>
                    <span style={{ color: "#868e96" }}>.az</span>
                  </h1>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#868e96",
                      margin: "4px 0 0 0",
                      fontFamily: "monospace",
                    }}
                  >
                    Network Topology Designer
                  </p>
                </div>
              </div>
            </WelcomeScreen.Center.Logo>
            <WelcomeScreen.Center.Heading>
              Create beautiful network diagrams
            </WelcomeScreen.Center.Heading>
            <WelcomeScreen.Center.Menu>
              <WelcomeScreen.Center.MenuItemLoadScene />
              <WelcomeScreen.Center.MenuItemHelp />
              <WelcomeScreen.Center.MenuItemLiveCollaborationTrigger
                onSelect={() => {
                  window.open("https://excalidraw.com/#room", "_blank");
                }}
              />
            </WelcomeScreen.Center.Menu>
          </WelcomeScreen.Center>
        </WelcomeScreen>

        {/* Main Menu with all features */}
        <MainMenu>
          <MainMenu.DefaultItems.LoadScene />
          <MainMenu.DefaultItems.SaveToActiveFile />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.Separator />
          <MainMenu.DefaultItems.LiveCollaborationTrigger
            onSelect={() => {
              window.open("https://excalidraw.com/#room", "_blank");
            }}
          />
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
            📚 Browse Libraries
          </MainMenu.Item>
        </MainMenu>
      </Excalidraw>
    </div>
  );
}
