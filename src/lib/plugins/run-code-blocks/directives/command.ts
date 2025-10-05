import { exec as _exec } from 'child_process';
import { Code } from 'mdast';
import { join } from 'path';
import { Option, assert } from 'ts-std';
import { promisify } from 'util';
import { parseCommands } from '../commands';
import Options from '../options';
import parseArgs, { ToBool, optional } from '../parse-args';

const exec = promisify(_exec);

interface Args {
  lang?: string;
  hidden?: boolean;
  cwd?: string;
  captureCommand?: boolean;
  captureOutput?: boolean;
}

export default async function command(node: Code, options: Options): Promise<Option<Code>> {
  let args = parseArgs<Args>(node, [
    optional('lang', String, 'shell'),
    optional('hidden', ToBool, false),
    optional('cwd', String),
    optional('captureCommand', ToBool, true),
    optional('captureOutput', ToBool, true)
  ]);

  if (args.hidden) {
    args.captureCommand = false;
    args.captureOutput = false;
  }

  assert(
    args.hidden === false || args.captureCommand === false || args.captureOutput === false,
    'At least one of `hidden`, `captureCommand` and `captureOutput` ' +
    'should be enabled, otherwise, you will have an empty code block!'
  );

  let { cwd } = options;

  if (args.cwd) {
    cwd = join(cwd, args.cwd);
  }

  let output: string[] = [];

  for (let { command: cmd, display } of parseCommands(node.value, options.cfg, node)) {
    console.log(`$ ${cmd}`);

    if (args.captureCommand) {
      output.push(`$ ${display}`);
    }

    let { stdout } = await exec(cmd, { cwd });

    if (args.captureOutput) {
      output.push(stdout);
    }

    console.log(stdout)
  }

  if (args.hidden) {
    return null;
  } else {
    return {
      ...node,
      lang: args.lang,
      meta: undefined,
      value: output.join('\n').trimRight()
    };
  }
}
