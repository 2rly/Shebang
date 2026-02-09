"use client";

import { useCallback, useState, useRef } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import NetworkNode from "./NetworkNode";
import {
  Server,
  Shield,
  Router,
  Monitor,
  Database,
  Cloud,
  Laptop,
  Smartphone,
  HardDrive,
  Wifi,
  Globe,
  Lock,
  Eye,
  AlertTriangle,
  Trash2,
  Download,
  Upload,
  Plus,
} from "lucide-react";

const nodeTypes = {
  networkNode: NetworkNode,
};

const deviceTypes = [
  { type: "server", label: "Server", icon: Server },
  { type: "firewall", label: "Firewall", icon: Shield },
  { type: "router", label: "Router", icon: Router },
  { type: "workstation", label: "Workstation", icon: Monitor },
  { type: "database", label: "Database", icon: Database },
  { type: "cloud", label: "Cloud", icon: Cloud },
  { type: "laptop", label: "Laptop", icon: Laptop },
  { type: "mobile", label: "Mobile", icon: Smartphone },
  { type: "storage", label: "Storage", icon: HardDrive },
  { type: "wireless", label: "WAP", icon: Wifi },
  { type: "internet", label: "Internet", icon: Globe },
  { type: "vpn", label: "VPN", icon: Lock },
  { type: "ids", label: "IDS/IPS", icon: Eye },
  { type: "threat", label: "Threat", icon: AlertTriangle },
];

const initialNodes: Node[] = [
  {
    id: "internet-1",
    type: "networkNode",
    position: { x: 400, y: 50 },
    data: { label: "Internet", type: "internet" },
  },
  {
    id: "firewall-1",
    type: "networkNode",
    position: { x: 400, y: 150 },
    data: { label: "Edge Firewall", type: "firewall", ip: "10.0.0.1" },
  },
  {
    id: "router-1",
    type: "networkNode",
    position: { x: 400, y: 280 },
    data: { label: "Core Router", type: "router", ip: "10.0.1.1" },
  },
  {
    id: "server-1",
    type: "networkNode",
    position: { x: 250, y: 400 },
    data: { label: "Web Server", type: "server", ip: "10.0.2.10" },
  },
  {
    id: "database-1",
    type: "networkNode",
    position: { x: 550, y: 400 },
    data: { label: "DB Server", type: "database", ip: "10.0.2.20" },
  },
];

const initialEdges: Edge[] = [
  { id: "e1", source: "internet-1", target: "firewall-1", animated: true, style: { stroke: "#00ff9d" } },
  { id: "e2", source: "firewall-1", target: "router-1", style: { stroke: "#00d4ff" } },
  { id: "e3", source: "router-1", target: "server-1", style: { stroke: "#00d4ff" } },
  { id: "e4", source: "router-1", target: "database-1", style: { stroke: "#00d4ff" } },
];

export default function TopologyCanvas() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const nodeIdCounter = useRef(10);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) =>
        addEdge(
          { ...connection, style: { stroke: "#00d4ff" }, animated: false },
          eds
        )
      ),
    []
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = {
        x: event.clientX - bounds.left - 60,
        y: event.clientY - bounds.top - 40,
      };

      const deviceInfo = deviceTypes.find((d) => d.type === type);
      const newNode: Node = {
        id: `${type}-${nodeIdCounter.current++}`,
        type: "networkNode",
        position,
        data: {
          label: deviceInfo?.label || type,
          type,
          ip: type !== "internet" && type !== "threat" ? "10.0.0.x" : undefined,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    []
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
    setSelectedDevice(nodeType);
  };

  const clearCanvas = () => {
    setNodes([]);
    setEdges([]);
  };

  const exportTopology = () => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "network-topology.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importTopology = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.nodes && data.edges) {
          setNodes(data.nodes);
          setEdges(data.edges);
        }
      } catch (err) {
        console.error("Failed to import topology:", err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Device Palette */}
      <div className="w-48 bg-cyber-surface border border-cyber-border rounded-lg p-3 overflow-y-auto">
        <h3 className="text-sm font-semibold text-cyber-text mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-cyber-primary" />
          Drag & Drop
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {deviceTypes.map((device) => {
            const Icon = device.icon;
            return (
              <div
                key={device.type}
                draggable
                onDragStart={(e) => onDragStart(e, device.type)}
                className={`p-2 rounded-lg border border-cyber-border bg-cyber-bg cursor-grab
                          hover:border-cyber-primary hover:bg-cyber-primary/10 transition-all
                          flex flex-col items-center gap-1 ${
                            selectedDevice === device.type ? "border-cyber-primary" : ""
                          }`}
              >
                <Icon className="w-5 h-5 text-cyber-muted" />
                <span className="text-[10px] text-cyber-muted text-center">
                  {device.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-cyber-border space-y-2">
          <button
            onClick={exportTopology}
            className="w-full cyber-btn text-xs flex items-center justify-center gap-2"
          >
            <Download className="w-3 h-3" />
            Export JSON
          </button>
          <label className="w-full cyber-btn-secondary text-xs flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-3 h-3" />
            Import JSON
            <input
              type="file"
              accept=".json"
              onChange={importTopology}
              className="hidden"
            />
          </label>
          <button
            onClick={clearCanvas}
            className="w-full px-3 py-2 text-xs font-mono uppercase tracking-wider
                     border border-cyber-accent text-cyber-accent rounded
                     hover:bg-cyber-accent hover:text-cyber-bg transition-all
                     flex items-center justify-center gap-2"
          >
            <Trash2 className="w-3 h-3" />
            Clear All
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={reactFlowWrapper}
        className="flex-1 bg-cyber-bg border border-cyber-border rounded-lg overflow-hidden"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[20, 20]}
          defaultEdgeOptions={{
            style: { stroke: "#00d4ff", strokeWidth: 2 },
            type: "smoothstep",
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#1e1e2e"
          />
          <Controls
            className="!bg-cyber-surface !border-cyber-border !rounded-lg"
          />
          <MiniMap
            className="!bg-cyber-surface !border-cyber-border !rounded-lg"
            nodeColor="#00ff9d"
            maskColor="rgba(10, 10, 15, 0.8)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
