const fs = require('fs');
const html = fs.readFileSync('../Fronted/index.html', 'utf8');

const startIndex = html.indexOf('<form id="registerForm"');
const endIndex = html.indexOf('</form>', startIndex);

const formHtml = html.substring(startIndex, endIndex + 7);

let divCount = 0;
let pos = 0;

while ((pos = formHtml.indexOf('<div', pos)) !== -1) {
    divCount++;
    pos += 4;
}

pos = 0;
while ((pos = formHtml.indexOf('</div', pos)) !== -1) {
    divCount--;
    pos += 5;
}

console.log('Unclosed div count in register form:', divCount);
