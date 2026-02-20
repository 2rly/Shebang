import { nanoid } from "nanoid";

export interface NetworkDevice {
  id: string;
  name: string;
  category: "Network" | "Security" | "Compute" | "Cloud";
  shape: "rectangle" | "diamond" | "ellipse";
  strokeColor: string;
  bgColor: string;
  width: number;
  height: number;
  rounded: boolean;
  dashed: boolean;
}

export const networkDevices: NetworkDevice[] = [
  // Network
  {
    id: "router",
    name: "Router",
    category: "Network",
    shape: "diamond",
    strokeColor: "#00ff9d",
    bgColor: "rgba(0, 255, 157, 0.08)",
    width: 120,
    height: 120,
    rounded: false,
    dashed: false,
  },
  {
    id: "switch",
    name: "Switch",
    category: "Network",
    shape: "rectangle",
    strokeColor: "#00d4ff",
    bgColor: "rgba(0, 212, 255, 0.08)",
    width: 140,
    height: 80,
    rounded: true,
    dashed: false,
  },
  {
    id: "wireless-ap",
    name: "Wireless AP",
    category: "Network",
    shape: "diamond",
    strokeColor: "#a855f7",
    bgColor: "rgba(168, 85, 247, 0.08)",
    width: 110,
    height: 110,
    rounded: false,
    dashed: false,
  },
  {
    id: "load-balancer",
    name: "Load Balancer",
    category: "Network",
    shape: "rectangle",
    strokeColor: "#f97316",
    bgColor: "rgba(249, 115, 22, 0.08)",
    width: 140,
    height: 80,
    rounded: true,
    dashed: false,
  },
  // Security
  {
    id: "firewall",
    name: "Firewall",
    category: "Security",
    shape: "diamond",
    strokeColor: "#ff006e",
    bgColor: "rgba(255, 0, 110, 0.08)",
    width: 120,
    height: 120,
    rounded: false,
    dashed: false,
  },
  {
    id: "vpn-gateway",
    name: "VPN Gateway",
    category: "Security",
    shape: "rectangle",
    strokeColor: "#00ff9d",
    bgColor: "rgba(0, 255, 157, 0.08)",
    width: 140,
    height: 80,
    rounded: true,
    dashed: true,
  },
  {
    id: "ids-ips",
    name: "IDS/IPS",
    category: "Security",
    shape: "rectangle",
    strokeColor: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.08)",
    width: 140,
    height: 80,
    rounded: false,
    dashed: false,
  },
  // Compute
  {
    id: "server",
    name: "Server",
    category: "Compute",
    shape: "rectangle",
    strokeColor: "#818cf8",
    bgColor: "rgba(129, 140, 248, 0.08)",
    width: 140,
    height: 90,
    rounded: false,
    dashed: false,
  },
  {
    id: "database",
    name: "Database",
    category: "Compute",
    shape: "ellipse",
    strokeColor: "#ffd60a",
    bgColor: "rgba(255, 214, 10, 0.08)",
    width: 120,
    height: 90,
    rounded: false,
    dashed: false,
  },
  {
    id: "workstation",
    name: "Workstation",
    category: "Compute",
    shape: "rectangle",
    strokeColor: "#a1a1aa",
    bgColor: "rgba(161, 161, 170, 0.08)",
    width: 130,
    height: 80,
    rounded: true,
    dashed: false,
  },
  // Cloud
  {
    id: "cloud",
    name: "Cloud",
    category: "Cloud",
    shape: "ellipse",
    strokeColor: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.08)",
    width: 160,
    height: 100,
    rounded: false,
    dashed: false,
  },
  {
    id: "internet",
    name: "Internet",
    category: "Cloud",
    shape: "ellipse",
    strokeColor: "#e4e4e7",
    bgColor: "rgba(228, 228, 231, 0.06)",
    width: 140,
    height: 100,
    rounded: false,
    dashed: true,
  },
];

export function createDeviceElements(
  device: NetworkDevice,
  x: number,
  y: number
) {
  const shapeId = nanoid();
  const textId = nanoid();
  const groupId = nanoid();

  const baseShape: Record<string, unknown> = {
    id: shapeId,
    type: device.shape,
    x,
    y,
    width: device.width,
    height: device.height,
    angle: 0,
    strokeColor: device.strokeColor,
    backgroundColor: device.bgColor,
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: device.dashed ? "dashed" : "solid",
    roughness: 0,
    opacity: 100,
    groupIds: [groupId],
    roundness: device.rounded ? { type: 3 } : null,
    seed: Math.floor(Math.random() * 100000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 100000),
    isDeleted: false,
    boundElements: [{ id: textId, type: "text" }],
    updated: Date.now(),
    link: null,
    locked: false,
  };

  const textElement: Record<string, unknown> = {
    id: textId,
    type: "text",
    x: x + device.width / 2 - (device.name.length * 4.5),
    y: y + device.height / 2 - 6,
    width: device.name.length * 9,
    height: 20,
    angle: 0,
    strokeColor: device.strokeColor,
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
    groupIds: [groupId],
    roundness: null,
    seed: Math.floor(Math.random() * 100000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 100000),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    text: device.name,
    fontSize: 14,
    fontFamily: 3, // Cascadia (monospace)
    textAlign: "center",
    verticalAlign: "middle",
    containerId: shapeId,
    originalText: device.name,
    autoResize: true,
    lineHeight: 1.2,
  };

  return [baseShape, textElement];
}

export function createLibraryItems() {
  return networkDevices.map((device) => {
    const elements = createDeviceElements(device, 0, 0);
    return {
      id: `netsentinel-${device.id}`,
      status: "published" as const,
      name: device.name,
      elements,
      created: Date.now(),
    };
  });
}
