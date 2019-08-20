import readline from 'readline';
import { promisify } from 'util';
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

export default async function ignore(_meta: string, message: string, _options: Options): Promise<null> {
  await prompt(message || 'Build paused...');
  return null;
}
