type Rule<K> = { key: K; alias: string };
type Filter = (ruleAlias: string, alias: string) => boolean;

/**
 * Word-based fuzzy lookup. Every word of an entry's alias becomes a rule; a query matches the
 * entries whose words match the most query words. Filters run from loosest to strictest and the
 * narrowest non-empty result wins, stopping early once a single entry remains.
 */
export class Lisa<T, K> {
    // A non-empty tuple type, so the first filter is known to exist.
    static readonly #filters: readonly [Filter, ...Filter[]] = [
        (rule, alias) => rule.includes(alias),
        (rule, alias) => rule.startsWith(alias),
        (rule, alias) => rule.endsWith(alias),
        (rule, alias) => rule === alias,
    ];

    #rules: Rule<K>[] = [];
    #entries = new Map<K, T>();

    constructor(entries: Iterable<T>, keyOf: (entry: T) => K, aliasOf: (entry: T) => string) {
        for (const entry of entries) {
            const key = keyOf(entry);
            this.#entries.set(key, entry);
            for (const word of aliasOf(entry).split(/\s+/)) {
                if (word !== "") {
                    this.#rules.push({ key, alias: word.toLowerCase() });
                }
            }
        }
    }

    findByKey(key: K): T | undefined {
        return this.#entries.get(key);
    }

    findByAlias(alias: string): T[] {
        const aliases = alias
            .toLowerCase()
            .split(/\s+/)
            .map(a => a.trim())
            .filter(a => a !== "");
        if (aliases.length === 0) {
            return [];
        }

        const [loosest, ...stricter] = Lisa.#filters;
        let result = this.#filterRules(aliases, loosest);
        for (const filter of stricter) {
            const attempt = this.#filterRules(aliases, filter);
            if (attempt.length !== 0 && attempt.length < result.length) {
                result = attempt;
            }
            if (attempt.length === 1) {
                break;
            }
        }

        return result.flatMap(key => this.#entries.get(key) ?? []);
    }

    #filterRules(aliases: string[], filter: Filter): K[] {
        const occurrences = new Map<K, number>();
        for (const alias of aliases) {
            for (const rule of this.#rules) {
                if (filter(rule.alias, alias)) {
                    occurrences.set(rule.key, (occurrences.get(rule.key) ?? 0) + 1);
                }
            }
        }

        const most = Math.max(...occurrences.values());
        return [...occurrences].filter(([, count]) => count === most).map(([key]) => key);
    }
}
