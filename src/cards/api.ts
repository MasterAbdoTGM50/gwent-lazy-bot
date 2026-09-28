import { DEFAULT_GWENT_API_KEY } from "../config.ts";
import type { GwentLocale } from "../locales.ts";
import { MINUTE, SECOND } from "../time.ts";
import { GWENT_ONE_API_URL, REPO_URL } from "../urls.ts";

/** One card as returned by api.gwent.one for a single language. */
export interface RawCard {
    id: { art: number; card: number; audio?: number };
    attributes: {
        set: string;
        type: string;
        armor: number;
        color: string;
        power: number;
        rarity: string;
        faction: string;
        factionSecondary: string;
        provision: number;
    };
    name: string;
    category: string;
    ability: string;
    flavor: string;
}

interface ApiResponse {
    /** REQUEST echoes the parameters gwent.one actually used, including the resolved version. */
    request?: { status?: number; message?: string; REQUEST?: { version?: string } };
    response?: Record<string, RawCard>;
}

export interface GwentApi {
    /** The latest game version the API serves. */
    fetchLatestVersion(): Promise<string>;
    /** Every card for one language, pinned to a specific game version. */
    fetchCardList(locale: GwentLocale, version: string): Promise<RawCard[]>;
}

// Any card that has existed since launch works: the API echoes the resolved version with it.
const PROBE_CARD_ID = 112101; // Ciri
const USER_AGENT = `gwent-lazy-bot (+${REPO_URL})`;
const VERSION_TIMEOUT_MS = 30 * SECOND;
// A single language is 1.8-2.8 MB and takes 13-16s on a good day.
const CARD_LIST_TIMEOUT_MS = 2 * MINUTE;

export function createGwentApi(key = DEFAULT_GWENT_API_KEY): GwentApi {
    async function get(params: Record<string, string>, timeoutMs: number): Promise<ApiResponse> {
        const url = new URL(GWENT_ONE_API_URL);
        url.search = new URLSearchParams({ key, ...params }).toString();
        const res = await fetch(url, {
            signal: AbortSignal.timeout(timeoutMs),
            headers: { "User-Agent": USER_AGENT },
        });
        if (!res.ok) {
            throw new Error(`gwent.one responded ${res.status} for ${url.search}`);
        }
        return (await res.json()) as ApiResponse;
    }

    return {
        async fetchLatestVersion() {
            const body = await get({ id: String(PROBE_CARD_ID) }, VERSION_TIMEOUT_MS);
            const version = body.request?.REQUEST?.version;
            if (typeof version !== "string" || !/^\d+(\.\d+)+$/.test(version)) {
                throw new Error(`gwent.one returned an unexpected version: ${JSON.stringify(version)}`);
            }
            return version;
        },
        async fetchCardList(locale, version) {
            // language=all times out upstream (502), so languages are fetched one at a time.
            const body = await get({ language: locale, version }, CARD_LIST_TIMEOUT_MS);
            // An unknown version isn't an error upstream: it silently serves the latest cards instead.
            const served = body.request?.REQUEST?.version;
            if (served !== version) {
                throw new Error(`gwent.one has no game version ${version} (it answered with ${served})`);
            }
            return Object.values(body.response ?? {});
        },
    };
}
