import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('C:\\Users\\asifk\\Downloads\\HMS_Landing_Page_Features.pdf');

const pdfFunc = typeof pdf === 'function' ? pdf : (pdf.default || Object.values(pdf).find(v => typeof v === 'function'));

pdfFunc(dataBuffer).then(function(data) {
    console.log(data.text);
}).catch(err => {
    console.error(err);
});
