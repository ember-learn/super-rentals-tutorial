import { Code } from 'mdast';
import readline from 'readline';
import { VFile } from 'vfile';
import Options from '../options';

async function prompt(message: string): Promise<void> {
  console.log(`\n${message}\n`);

  await new Promise<void>(resolve => {
    let rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Press ENTER when ready to resume', () => {
      rl.close();
      resolve();
    });
  });

  console.log('\nResuming\n');
}

export default async function pause({ value, position }: Code, _options: Options, { path }: VFile): Promise<null> {
  if (value) {
    console.log(value);
  }

  let location = '';

  if (path) {
    location = `${location} at ${path}`
  }

  if (position) {
    location = `${location} on line ${position.start.line}`;
  }

  await prompt(`Build paused${location}...`);

  return null;
}
