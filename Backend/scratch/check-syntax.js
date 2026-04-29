const fs = require('fs');
const html = fs.readFileSync('../Fronted/index.html', 'utf8');
const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
let match;
let i = 0;
while ((match = scriptRegex.exec(html)) !== null) {
    fs.writeFileSync(`scratch/script_${i}.js`, match[1]);
    try {
        require('child_process').execSync(`node -c scratch/script_${i}.js`);
        console.log(`Script ${i} is valid.`);
    } catch (e) {
        console.error(`Script ${i} has a syntax error!\n${e.stderr.toString()}`);
    }
    i++;
}
