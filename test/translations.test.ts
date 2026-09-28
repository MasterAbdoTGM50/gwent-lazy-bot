import { describe, expect, test } from "bun:test";
import { translations } from "../src/cards/translations.ts";
import { CARD_TYPES, FACTIONS, RARITIES } from "../src/cards/types.ts";
import { LOCALES } from "../src/locales.ts";

describe("translations.json", () => {
    for (const locale of LOCALES) {
        test(`${locale} has every label card embeds use`, () => {
            const t = translations[locale];
            expect(t).toBeDefined();
            for (const label of [t.provision, t.power, t.armor]) {
                expect(label).toBeTruthy();
            }
            for (const [table, keys] of [
                [t.factions, FACTIONS],
                [t.rarities, RARITIES],
                [t.types, CARD_TYPES],
            ] as const) {
                for (const key of keys) {
                    expect((table as Record<string, string>)[key], `${locale}: ${key}`).toBeTruthy();
                }
            }
        });
    }
});
