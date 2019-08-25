import { Code } from 'mdast';
import { join } from 'path';
import { Option, assert } from 'ts-std';
import Options from '../../options';
import parseArgs, { ToBool, optional } from '../../parse-args';
import Servers from '../../servers';
import { parseCommands } from '../command';

interface Args {
  id?: string;
  hidden?: boolean;
  cwd?: string;
  expect?: string;
  timeout?: number;
  captureOutput?: boolean;
}

export function parseCommand(command: string): string {
  let commands = parseCommands(command);

  assert(commands.length === 1, `cannot pass multiple commands to \`run:server:start\``);

  return commands[0];
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

  let cmd = parseCommand(node.value);
  let id = args.id || cmd;
  let { cwd } = options;

  if (args.cwd) {
    cwd = join(cwd, args.cwd);
  }

  let server = servers.add(id, cmd, cwd);

  console.log(`$ ${cmd}`);

  let output = await server.start(args.expect);
  let value;

  if (args.captureOutput && output) {
    value = `$ ${cmd}\n${output}`;
  } else {
    value = `$ ${cmd}`;
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
