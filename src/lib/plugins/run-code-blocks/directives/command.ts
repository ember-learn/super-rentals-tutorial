import { exec as _exec } from 'child_process';
import { Code } from 'mdast';
import { join } from 'path';
import { Option } from 'ts-std';
import { promisify } from 'util';
import Options from '../options';
import parseArgs, { ToBool, optional } from '../parse-args';

const exec = promisify(_exec);

interface Args {
  hidden?: boolean;
  cwd?: string;
  captureOutput?: boolean;
}

export function parseCommands(commands: string): string[] {
  return commands.split(/(?<!\\)\n/)
    .filter(line => line && !line.startsWith('#'));
}

export default async function command(node: Code, options: Options): Promise<Option<Code>> {
  let args = parseArgs<Args>(node, [
    optional('hidden', ToBool, false),
    optional('cwd', String),
    optional('captureOutput', ToBool, true)
  ]);

  if (args.hidden) {
    args.captureOutput = false;
  }

  let { cwd } = options;

  if (args.cwd) {
    cwd = join(cwd, args.cwd);
  }

  let output = [];

  for (let cmd of parseCommands(node.value)) {
    console.log(`$ ${cmd}`);
    output.push(`$ ${cmd}`);

    let { stdout } = await exec(cmd, { cwd });

    if (args.captureOutput) {
      output.push(stdout);
    }
  }

  if (args.hidden) {
    return null;
  } else {
    return {
      ...node,
      lang: 'shell',
      meta: undefined,
      value: output.join('\n').trimRight()
    };
  }
}
