/** @type {string[]} */
const myArgs = process.argv.slice(2);
const fs = require('fs');
const path = require('path');

console.log("aefwerg");
console.log(__dirname);

const stdPath = path.join(__dirname, '../src/std.polca');
const stdTarget = path.join(__dirname, '../dist/std.polca.js');

function exportStd () {
    const content = fs.readFileSync(stdPath);
    fs.writeFileSync(stdTarget, `polcaStd = Polca.compile(\`` + content + `\`)`);
}

if (myArgs.includes("--watch")) {
    fs.watchFile(stdPath, exportStd)
} else {
    exportStd();
}