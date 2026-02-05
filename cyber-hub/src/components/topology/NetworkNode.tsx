"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
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
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  server: Server,
  firewall: Shield,
  router: Router,
  workstation: Monitor,
  database: Database,
  cloud: Cloud,
  laptop: Laptop,
  mobile: Smartphone,
  storage: HardDrive,
  wireless: Wifi,
  internet: Globe,
  vpn: Lock,
  ids: Eye,
  threat: AlertTriangle,
};

const colorMap: Record<string, string> = {
  server: "text-cyber-secondary border-cyber-secondary",
  firewall: "text-cyber-accent border-cyber-accent",
  router: "text-cyber-primary border-cyber-primary",
  workstation: "text-cyber-text border-cyber-text",
  database: "text-purple-400 border-purple-400",
  cloud: "text-blue-400 border-blue-400",
  laptop: "text-cyan-400 border-cyan-400",
  mobile: "text-green-400 border-green-400",
  storage: "text-orange-400 border-orange-400",
  wireless: "text-yellow-400 border-yellow-400",
  internet: "text-cyber-primary border-cyber-primary",
  vpn: "text-cyber-warning border-cyber-warning",
  ids: "text-cyber-secondary border-cyber-secondary",
  threat: "text-red-500 border-red-500",
};

interface NetworkNodeData {
  label: string;
  type: string;
  ip?: string;
}

function NetworkNode({ data, selected }: NodeProps & { data: NetworkNodeData }) {
  const Icon = iconMap[data.type] || Server;
  const colorClass = colorMap[data.type] || "text-cyber-text border-cyber-text";

  return (
    <div
      className={`px-4 py-3 rounded-lg bg-cyber-surface border-2 ${colorClass} ${
        selected ? "ring-2 ring-cyber-primary ring-offset-2 ring-offset-cyber-bg" : ""
      } transition-all hover:scale-105 min-w-[120px]`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-cyber-primary !border-cyber-bg"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-cyber-primary !border-cyber-bg"
      />

      <div className="flex flex-col items-center gap-2">
        <Icon className={`w-8 h-8 ${colorClass.split(" ")[0]}`} />
        <span className="text-xs font-mono text-cyber-text text-center">
          {data.label}
        </span>
        {data.ip && (
          <span className="text-[10px] font-mono text-cyber-muted">
            {data.ip}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-cyber-secondary !border-cyber-bg"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-cyber-secondary !border-cyber-bg"
      />
    </div>
  );
}

export default memo(NetworkNode);
