const fs = require('fs');
const parser = require('@babel/parser');

try {
  const code = fs.readFileSync('src/pages/Billing.jsx', 'utf8');
  parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx']
  });
  console.log('Parsing successful! No syntax errors found.');
} catch (err) {
  console.error('Parsing failed:');
  console.error(err.message);
  if (err.loc) {
    console.error(`Error at line ${err.loc.line}, column ${err.loc.column}`);
  }
}
