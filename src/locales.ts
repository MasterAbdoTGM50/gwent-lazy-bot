export const LOCALES = ["en", "cn", "de", "es", "fr", "it", "jp", "kr", "mx", "pl", "pt", "ru"] as const;

export type GwentLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: GwentLocale = "en";

export const LOCALE_NAMES: Record<GwentLocale, string> = {
    en: "English",
    cn: "简体中文",
    de: "Deutsch",
    es: "Español",
    fr: "Français",
    it: "Italiano",
    jp: "日本語",
    kr: "한국어",
    mx: "Español (Latinoamérica)",
    pl: "Polski",
    pt: "Português (Brasil)",
    ru: "Русский",
};

export function isLocale(value: string): value is GwentLocale {
    return (LOCALES as readonly string[]).includes(value);
}

export type Localized = Record<GwentLocale, string>;
