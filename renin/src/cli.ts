import fs from 'fs/promises';
import path from 'path';
import url from 'url';

function printHelp() {
  console.log('Usage: npx renin init <name>');
}

async function init(name: string) {
  console.log(`Creating new renin project in ${name}...`);
  const base = path.dirname(url.fileURLToPath(import.meta.url));
  try {
    await fs.access(name);
    console.log(`${name} already exists, aborting.`);
    process.exit(1);
  } catch {}
  await fs.mkdir(name, { recursive: true });
  await fs.cp(path.join(base, 'example-project'), name, { recursive: true });
  console.log('Project set up!');
}

export async function main() {
  if (process.argv.length == 4 && process.argv[2] === 'init') {
    const name = process.argv[3];
    try {
      await init(name);
    } catch (e) {
      console.log('Sadly, something went wrong. Sorry!');
      throw e;
    }
    process.exit(0);
  } else {
    printHelp();
    process.exit(1);
  }
}
