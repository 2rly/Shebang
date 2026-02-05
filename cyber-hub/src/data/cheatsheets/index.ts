import { linuxCheatsheet } from "./linux";
import { pythonCheatsheet } from "./python";
import { windowsCheatsheet } from "./windows";

export interface CommandItem {
  cmd: string;
  desc: string;
}

export interface CommandSection {
  title: string;
  commands?: CommandItem[];
  code?: string;
}

export interface Cheatsheet {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  lastUpdated: string;
  sections: CommandSection[];
  isCustom?: boolean;
}

export const defaultCheatsheets: Cheatsheet[] = [
  linuxCheatsheet as Cheatsheet,
  pythonCheatsheet as Cheatsheet,
  windowsCheatsheet as Cheatsheet,
];

export { linuxCheatsheet, pythonCheatsheet, windowsCheatsheet };
