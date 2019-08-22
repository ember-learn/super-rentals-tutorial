import { Code } from 'mdast';
import readline from 'readline';
import Options from '../options';

async function prompt(message: string): Promise<void> {
  console.log(`\n${message}\n`);

  await new Promise(resolve => {
    let rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Press ENTER when ready to resume', resolve);
  });

  console.log('\nResuming');
}

export default async function pause({ value, position }: Code, _options: Options): Promise<null> {
  if (value) {
    console.log(value);
  }

  if (position) {
    await prompt(`Build paused on line ${position.start.line}...`);
  } else {
    await prompt('Build paused...');
  }

  return null;
}
