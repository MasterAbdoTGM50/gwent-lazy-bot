import type { GwentLocale } from "./locales.ts";

export const REPO_URL = "https://github.com/MasterAbdoTGM50/gwent-lazy-bot";
export const GWENT_ONE_ORIGIN = "https://gwent.one";
export const GWENT_ONE_API_URL = "https://api.gwent.one/";
export const PLAYGWENT_ORIGIN = "https://www.playgwent.com";

/** Links and images on gwent.one, the bot's card data source. */
export const gwentOne = {
    cardPage: (locale: GwentLocale, cardId: number) => `${GWENT_ONE_ORIGIN}/${locale}/card/${cardId}`,
    cardArt: (artId: number) => `${GWENT_ONE_ORIGIN}/image/gwent/assets/card/art/medium/${artId}.jpg`,
    abilityIcon: (cardId: number) => `${GWENT_ONE_ORIGIN}/img/icon/ability/${cardId}.png`,
};
