import { log } from "../log.ts";
import { MINUTE } from "../time.ts";
import type { CardStore } from "./store.ts";

/** Retry delay while there are no cards at all (first boot with gwent.one down). */
const NO_CARDS_RETRY_MS = 5 * MINUTE;

export interface ScheduleOptions {
    /** Delay between successful checks. */
    intervalMs: number;
    /** Delay before retrying after a failed check. */
    retryMs: number;
    /** Called after each successful update that changed the card data. */
    onUpdated?: () => void;
}

/** Checks for new card data right away, then keeps checking on an interval. Returns a stop function. */
export function scheduleCardUpdates(store: CardStore, options: ScheduleOptions): () => void {
    let timer: Timer | undefined;
    let stopped = false;

    async function run() {
        let next = options.intervalMs;
        try {
            const result = await store.checkForUpdate();
            if (result.status === "updated") {
                options.onUpdated?.();
            } else {
                log.info(`Card data is up to date (game version ${result.version})`);
            }
        } catch (err) {
            next = store.ready ? options.retryMs : Math.min(options.retryMs, NO_CARDS_RETRY_MS);
            log.error(`Card update check failed, retrying in ${Math.round(next / MINUTE)} min:`, err);
        }
        if (!stopped) {
            timer = setTimeout(run, next);
        }
    }

    void run();
    return () => {
        stopped = true;
        clearTimeout(timer);
    };
}
