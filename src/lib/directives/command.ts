import { exec as _exec } from 'child_process';
import { Code } from 'mdast';
import { join } from 'path';
import { Option, assert } from 'ts-std';
import { promisify } from 'util';
import Options from '../options';
import parseArgs, { ToBool, optional } from '../parse-args';

const exec = promisify(_exec);

interface Args {
  hidden?: boolean;
  cwd?: string;
  captureOutput?: boolean;
}

function parseCommands(commands: string): string[] {
  return commands.split(/(?<!\\)\n/)
    .filter(line => line && !line.startsWith('#'));
}

export default async function command(meta: string, commands: string, options: Options): Promise<Option<Code>> {
  let args = parseArgs<Args>('command', meta, [
    optional('hidden', ToBool),
    optional('cwd', String),
    optional('captureOutput', ToBool, true)
  ]);

  if (args.hidden) {
    args.captureOutput = false;
  }

  let output = [];

  for (let cmd of parseCommands(commands)) {
    console.log(`Running command \`${cmd}\``);

    output.push(`$ ${cmd}`);

    let { cwd } = options;

    if (args.cwd) {
      cwd = join(cwd, args.cwd);
    }

    let { stdout } = await exec(cmd, { cwd });

    if (args.captureOutput) {
      output.push(stdout);
    }
  }

  if (args.hidden) {
    return null;
  } else {
    return {
      type: 'code',
      lang: 'shell',
      value: output.join('\n').trimRight()
    };
  }
}
