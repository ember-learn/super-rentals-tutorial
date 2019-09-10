import { exec as _exec } from 'child_process';
import { Code } from 'mdast';
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

export default async function checkpoint(node: Code, options: Options): Promise<null> {
  let args = parseArgs<Args>(node, [
    optional('cwd', String),
    optional('commit', ToBool, true)
  ]);

  let message = node.value;
  let [title] = message.split('\n');

  let { cwd } = options;

  if (args.cwd) {
    cwd = join(cwd, args.cwd);
  }

  console.log(`$ yarn lint:hbs`);

  await exec('yarn lint:hbs', { cwd });

  console.log(`$ yarn lint:js`);

  await exec('yarn lint:js', { cwd });

  console.log(`$ yarn test`);

  await exec('yarn test', { cwd });

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
