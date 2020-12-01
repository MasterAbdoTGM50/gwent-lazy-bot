class Lisa {
    #keyPath;
    #rules = [];

    constructor(entries, keyPath) {
        this.#keyPath = keyPath;
        this.#buildRules(entries);
    }

    #buildRules = entries => {
        for(let i = 0; i < entries.length; ++i) {
            let words = this.#keyPath.split(".").reduce((o, p) => o && o[p] || null, entries[i]).split(/\s+/);
            for(let word of words) {
                this.#rules.push({ key: word.toLowerCase(), index: i });
            }
        }
    };

    search(key) {
        let keys = key.toLowerCase().split(/\s+/).map(key => key.trim());
        let attempt = this.#filterRules(keys, (rule, key) => { return rule.key.includes(key); });
        let result = attempt;
        if(result.length > 1) {
            attempt = this.#filterRules(keys, (rule, key) => { return rule.key === key; });
            if(attempt.length !== 0 && attempt.length < result.length) { result = attempt; }
        }

        return result;
    }

    #filterRules = (keys, filterFn) => {
        let matches = [];

        keys.forEach(key => {
            this.#rules.forEach(rule => {
                if(filterFn(rule, key)) { matches.push(rule); }
            })
        })

        let occurrences = matches.reduce((acc, rule) => acc.set(rule.index, (acc.get(rule.index) || 0) + 1), new Map());
        let mostOccurrence = Math.max(...occurrences.values());

        return [...occurrences.entries()].filter(([, v]) => v === mostOccurrence).map(([k,]) => k);
    }

}

module.exports = Lisa;