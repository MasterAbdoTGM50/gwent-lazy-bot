export const NEUTRAL_COLOR = 0x7f6000;

/** Embed accent colors per faction. */
const FACTION_COLORS: Record<string, number> = {
    neutral: NEUTRAL_COLOR,
    monsters: 0xc56c6c,
    nilfgaard: 0xf0d447,
    northernrealms: 0x48c1ff,
    scoiatael: 0x2abd36,
    skellige: 0xad39ec,
    syndicate: 0xe67e22,
};

// gwent.one says "Monster" / "Northern Realms"; playgwent.com says "monsters" / "northernrealms".
const ALIASES: Record<string, string> = { monster: "monsters" };

/** The accent color for a faction as spelled by either gwent.one or playgwent.com; neutral if unknown. */
export function factionColor(faction: string): number {
    const key = faction.toLowerCase().replace(/[\s']/g, "");
    return FACTION_COLORS[ALIASES[key] ?? key] ?? NEUTRAL_COLOR;
}
