class Lisa {

    #keyPath;
    #aliasPath;
    #rules = [];
    #entries;
    #filters = [
        function (rule, alias) { return rule.alias.includes(alias) },
        function (rule, alias) { return rule.alias.startsWith(alias) },
        function (rule, alias) { return rule.alias.endsWith(alias) },
        function (rule, alias) { return rule.alias === alias; }
    ];

    constructor(entries, keyPath, aliasPath) {
        this.#entries = entries;
        this.#keyPath = keyPath;
        this.#aliasPath = aliasPath;
        this.#buildRules(this.#entries);
    }

    #resolveObjProperty = (obj, path) => { return path.split(".").reduce((o, p) => o && o[p] || null, obj); }

    #buildRules = entries => {
        for(let entry of entries) {
            let key = this.#resolveObjProperty(entry, this.#keyPath);
            let alias = this.#resolveObjProperty(entry, this.#aliasPath).split(/\s+/);
            for(let word of alias) {
                this.#rules.push({ key: key , alias: word.toLowerCase() });
            }
        }
    };

    findByKey(key) { return this.#entries.find(entry => this.#resolveObjProperty(entry, this.#keyPath) === key); }

    findByAlias(alias) {
        let aliases = alias.toLowerCase().split(/\s+/).map(alias => alias.trim());

        let attempt = this.#filterRules(aliases, this.#filters[0]);
        let result = attempt;
        for(let i = 1; i < this.#filters.length; ++i) {
            attempt = this.#filterRules(aliases, this.#filters[i]);
            if(attempt.length !== 0 && attempt.length < result.length) { result = attempt; }
            if(attempt.length === 1) { break; }
        }

        return result.map(key => this.findByKey(key));
    }

    #filterRules = (aliases, filterFn) => {
        let matches = [];

        aliases.forEach(alias => {
            this.#rules.forEach(rule => {
                if(filterFn(rule, alias)) { matches.push(rule); }
            })
        })

        let occurrences = matches.reduce((acc, rule) => acc.set(rule.key, (acc.get(rule.key) || 0) + 1), new Map());
        let mostOccurrence = Math.max(...occurrences.values());

        return [...occurrences.entries()].filter(([, v]) => v === mostOccurrence).map(([k,]) => k);
    }

}

module.exports = Lisa;