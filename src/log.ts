/** Syslog priorities, which journald reads from a "<N>" prefix at the start of a line. */
const PRIORITY = { error: 3, warn: 4, info: 6 } as const;
type Level = keyof typeof PRIORITY;

/**
 * Under systemd (which sets JOURNAL_STREAM when output goes to journald) the journal adds its own
 * timestamps, so lines only carry their priority; `journalctl -p warning` then filters by level.
 * Anywhere else they start with a timestamp and the level name.
 */
export function prefix(level: Level, env: Record<string, string | undefined> = process.env): string {
    return env.JOURNAL_STREAM ? `<${PRIORITY[level]}>` : `${new Date().toISOString()} ${level.toUpperCase().padEnd(5)}`;
}

/**
 * The arguments for console.*, with the prefix in front. journald only reads a priority that the
 * line starts with directly, and console.* would put a space between separate arguments, so the
 * priority is joined onto a leading message.
 */
export function withPrefix(level: Level, args: unknown[], env: Record<string, string | undefined> = process.env) {
    const [first, ...rest] = args;
    const head = prefix(level, env);
    return env.JOURNAL_STREAM && typeof first === "string" ? [head + first, ...rest] : [head, ...args];
}

// `bun test` sets NODE_ENV=test; keep test output to warnings and errors.
const quiet = process.env.NODE_ENV === "test";

export const log = {
    info: (...args: unknown[]) => {
        if (!quiet) {
            console.log(...withPrefix("info", args));
        }
    },
    warn: (...args: unknown[]) => console.warn(...withPrefix("warn", args)),
    error: (...args: unknown[]) => console.error(...withPrefix("error", args)),
};
