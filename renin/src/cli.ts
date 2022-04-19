import fs from 'fs/promises';

function printHelp() {
  console.log('Usage: npx renin init <name>');
}

async function init(name: string) {
  console.log(`Creating new renin project in ${name}...`);
  await fs.mkdir(name, { recursive: true });
  console.log('Project set up!');
}

export async function main() {
  console.log(process.argv);
  if (process.argv.length == 4 && process.argv[2] === 'init') {
    const name = process.argv[3];
    await init(name);
    process.exit(0);
  } else {
    printHelp();
    process.exit(1);
  }
}
