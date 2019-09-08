import { Code } from 'mdast';
import { join } from 'path';
import { Option, assert } from 'ts-std';
import { parseCommand } from '../../commands';
import Options from '../../options';
import parseArgs, { ToBool, optional } from '../../parse-args';
import Servers from '../../servers';

interface Args {
  id?: string;
  hidden?: boolean;
  cwd?: string;
  expect?: string;
  timeout?: number;
  captureOutput?: boolean;
}

export default async function startServer(node: Code, options: Options, servers: Servers): Promise<Option<Code>> {
  let args = parseArgs<Args>(node, [
    optional('id', String),
    optional('hidden', ToBool, false),
    optional('cwd', String),
    optional('expect', String),
    optional('timeout', Number),
    optional('captureOutput', ToBool)
  ]);

  if (args.hidden) {
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

  let { command, display } = parseCommand(node.value, options.cfg, node);
  let id = args.id || display;
  let { cwd } = options;

  if (args.cwd) {
    cwd = join(cwd, args.cwd);
  }

  let server = servers.add(id, command, cwd);

  console.log(`$ ${command}`);

  let output = await server.start(args.expect);
  let value;

  if (args.captureOutput && output) {
    value = `$ ${display}\n${output}`;
  } else {
    value = `$ ${display}`;
  }

  if (args.hidden) {
    return null;
  } else {
    return {
      ...node,
      lang: 'shell',
      meta: undefined,
      value
    };
  }
}
