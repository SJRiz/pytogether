import fs from 'fs';

const version = {
  version: new Date().getTime().toString(),
};

fs.writeFileSync('./public/version.json', JSON.stringify(version));
console.log(`Generated version.json: ${version.version}`);