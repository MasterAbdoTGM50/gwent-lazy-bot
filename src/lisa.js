class Lisa {
    #rules = {}
    constructor(entries) {
        this.#buildRules(entries);
    }

    #buildRules = entries => {
        for(let entry of entries) {
            let words = entry.name.split(/\s+/);
            for(let word of words) {
                word = word.toLowerCase();
                if(!this.#rules.hasOwnProperty(word)) { this.#rules[word] = [] }
                this.#rules[word].push(entry);
            }
        }
    };

    search(key) {
        let matches = [];
        let keys = key.split(/\s+/);

        //Phase #1: Can I find an Initial Rules Set?
        for(key of keys) {
            for(let rule in this.#rules) {
                if(rule.includes(key)) { matches.push({ key: rule, value: this.#rules[rule] }); }
            }
        }

        let result = matches;

        //Phase #2: Can I count the occurrences?
        let values = [];
        matches.forEach(match => { values.push(...match.value); });
        let occurrences = values.reduce((acc, cur) => {
            if(!acc.hasOwnProperty(cur.name)) { acc[cur.name] = { count: 0, value: cur }; }
            acc[cur.name].count++;
            return acc;
        }, {});
        let dupes = Object.values(occurrences).reduce((max, cur) => {
            return cur.count > max ? cur.count : max;
        }, 1);
        let intersections = Object.values(occurrences).filter(occurrence => occurrence.count === dupes);

        console.log(JSON.stringify(occurrences, null, 4));
        console.log(dupes);

        //Return result
        return result;
    }
}

module.exports = Lisa;