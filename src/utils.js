const fs = require("fs");
const path = require("path");

function lazyImport(dir, readSubDir = false) {
    let imports = [];
    let files = fs.readdirSync(dir);
    for(let file of files) {
        let stat = fs.lstatSync(path.join(dir, file));
        if(readSubDir && stat.isDirectory()) {
            imports.push(...lazyImport(path.join(dir, file), readSubDir));
        } else if(file.endsWith(".js")) {
            imports.push(require(path.join(dir, file)));
        }
    }
    return imports;
}

module.exports = { lazyImport }