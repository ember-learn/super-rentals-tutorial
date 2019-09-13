import { Code } from 'mdast';
import { join } from 'path';
import { Option, assert } from 'ts-std';
import { parseCommand } from '../../commands';
import Options from '../../options';
import parseArgs, { ToBool, optional } from '../../parse-args';
import Servers from '../../servers';

interface Args {
  id?: string;
  lang?: string;
  hidden?: boolean;
  cwd?: string;
  expect?: string;
  timeout?: number;
  captureCommand?: boolean;
  captureOutput?: boolean;
}

export default async function startServer(node: Code, options: Options, servers: Servers): Promise<Option<Code>> {
  let args = parseArgs<Args>(node, [
    optional('id', String),
    optional('lang', String, 'shell'),
    optional('hidden', ToBool, false),
    optional('cwd', String),
    optional('expect', String),
    optional('timeout', Number),
    optional('captureCommand', ToBool, true),
    optional('captureOutput', ToBool)
  ]);

  if (args.hidden) {
    args.captureCommand = false;
    args.captureOutput = false;
  }

  if (args.expect || args.timeout) {
    if (args.captureOutput === undefined && args.hidden === false) {
      args.captureOutput = true;
    }
  }

  if (args.captureOutput) {
    assert(
      !!args.expect || !!args.timeout,
      'at least one of `expect` or `timeout` must be set when using ' +
      '`captureOutput` in `run:server:start'
    );
  }

  assert(
    args.hidden === false || args.captureCommand === false || args.captureOutput === false,
    'At least one of `hidden`, `captureCommand` and `captureOutput` ' +
    'should be enabled, otherwise, you will have an empty code block!'
  );

  let { command, display } = parseCommand(node.value, options.cfg, node);
  let id = args.id || display;
  let { cwd } = options;

  if (args.cwd) {
    cwd = join(cwd, args.cwd);
  }

  let output: string[] = [];

  let server = servers.add(id, command, cwd);

  console.log(`$ ${command}`);

  if (args.captureCommand) {
    output.push(`$ ${display}`);
  }

  let stdout = await server.start(args.expect);

  if (args.captureOutput && stdout) {
    output.push(stdout);
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
