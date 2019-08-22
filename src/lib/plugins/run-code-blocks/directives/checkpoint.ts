import { exec as _exec } from 'child_process';
import { join } from 'path';
import { assert } from 'ts-std';
import { promisify } from 'util';
import Options from '../options';
import parseArgs, { ToBool, optional } from '../parse-args';

const exec = promisify(_exec);

interface Args {
  cwd?: string;
  commit?: boolean;
}

export default async function checkpoint(meta: string, message: string, options: Options): Promise<null> {
  let args = parseArgs<Args>('checkpoint', meta, [
    optional('cwd', String),
    optional('commit', ToBool, true)
  ]);

  let [title] = message.split('\n');

  let { cwd } = options;

  if (args.cwd) {
    cwd = join(cwd, args.cwd);
  }

  console.log(`$ npm run lint:hbs`);

  await exec('npm run lint:hbs', { cwd });

  console.log(`$ npm run lint:js`);

  await exec('npm run lint:js', { cwd });

  console.log(`$ npm run test`);

  await exec('npm run test', { cwd });

  if (args.commit) {
    console.log(`$ git commit -m ${JSON.stringify(title)}`);

    let promise = exec('git commit -F -', { cwd });

    if (!message.endsWith('\n')) {
      message = `${message}\n`;
    }

    promise.child.stdin!.end(message, 'utf8');

    await promise;
  }

  let { stdout } = await exec('git status --short', { cwd });

  assert(stdout === '', `Unexpected dirty files!\n\n${stdout}`);

  return null;
}
