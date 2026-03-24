// WoW class colors (official colors)
export const CLASS_COLORS: Record<string, string> = {
  "Death Knight": "#C41E3A",
  "Demon Hunter": "#A330C9",
  Druid: "#FF7C0A",
  Evoker: "#33937F",
  Hunter: "#AAD372",
  Mage: "#3FC7EB",
  Monk: "#00FF98",
  Paladin: "#F48CBA",
  Priest: "#FFFFFF",
  Rogue: "#FFF468",
  Shaman: "#0070DD",
  Warlock: "#8788EE",
  Warrior: "#C69B6D",
};

// WoW classes and their specs
export const CLASS_SPECS: Record<string, { name: string; role: "TANK" | "HEALER" | "DPS" }[]> = {
  "Death Knight": [
    { name: "Blood", role: "TANK" },
    { name: "Frost", role: "DPS" },
    { name: "Unholy", role: "DPS" },
  ],
  "Demon Hunter": [
    { name: "Havoc", role: "DPS" },
    { name: "Vengeance", role: "TANK" },
  ],
  Druid: [
    { name: "Balance", role: "DPS" },
    { name: "Feral", role: "DPS" },
    { name: "Guardian", role: "TANK" },
    { name: "Restoration", role: "HEALER" },
  ],
  Evoker: [
    { name: "Augmentation", role: "DPS" },
    { name: "Devastation", role: "DPS" },
    { name: "Preservation", role: "HEALER" },
  ],
  Hunter: [
    { name: "Beast Mastery", role: "DPS" },
    { name: "Marksmanship", role: "DPS" },
    { name: "Survival", role: "DPS" },
  ],
  Mage: [
    { name: "Arcane", role: "DPS" },
    { name: "Fire", role: "DPS" },
    { name: "Frost", role: "DPS" },
  ],
  Monk: [
    { name: "Brewmaster", role: "TANK" },
    { name: "Mistweaver", role: "HEALER" },
    { name: "Windwalker", role: "DPS" },
  ],
  Paladin: [
    { name: "Holy", role: "HEALER" },
    { name: "Protection", role: "TANK" },
    { name: "Retribution", role: "DPS" },
  ],
  Priest: [
    { name: "Discipline", role: "HEALER" },
    { name: "Holy", role: "HEALER" },
    { name: "Shadow", role: "DPS" },
  ],
  Rogue: [
    { name: "Assassination", role: "DPS" },
    { name: "Outlaw", role: "DPS" },
    { name: "Subtlety", role: "DPS" },
  ],
  Shaman: [
    { name: "Elemental", role: "DPS" },
    { name: "Enhancement", role: "DPS" },
    { name: "Restoration", role: "HEALER" },
  ],
  Warlock: [
    { name: "Affliction", role: "DPS" },
    { name: "Demonology", role: "DPS" },
    { name: "Destruction", role: "DPS" },
  ],
  Warrior: [
    { name: "Arms", role: "DPS" },
    { name: "Fury", role: "DPS" },
    { name: "Protection", role: "TANK" },
  ],
};

export const WOW_CLASSES = Object.keys(CLASS_SPECS);

export const RAID_ROLES = ["TANK", "HEALER", "DPS"] as const;

export const DIFFICULTIES = ["Normal", "Heroic", "Mythic"] as const;

// Role icons (emoji shorthand for display)
export const ROLE_ICONS: Record<string, string> = {
  TANK: "🛡️",
  HEALER: "💚",
  DPS: "⚔️",
};
