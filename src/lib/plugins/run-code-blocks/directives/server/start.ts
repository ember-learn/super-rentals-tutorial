import { Code } from 'mdast';
import { createConnection } from 'net';
import { join } from 'path';
import { Option, assert } from 'ts-std';
import { parseCommand } from '../../commands';
import Options from '../../options';
import parseArgs, { ToBool, optional } from '../../parse-args';
import Servers from '../../servers';

const DEFAULT_READY_TIMEOUT = 30000;
const READY_RETRY_INTERVAL = 500;

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

function extractURL(expect: Option<string>): Option<string> {
  if (!expect) {
    return null;
  }

  let match = expect.match(/https?:\/\/[^\s"']+/);

  if (match) {
    return match[0]!;
  } else {
    return null;
  }
}

async function waitForServerReady(url: string, timeout: number): Promise<void> {
  let parsed = new URL(url);
  let host = parsed.hostname;
  let port = parsed.port ? Number(parsed.port) : (parsed.protocol === 'https:' ? 443 : 80);
  let startedAt = Date.now();
  let lastError: Option<Error> = null;

  while (Date.now() - startedAt < timeout) {
    try {
      await new Promise<void>((resolve, reject) => {
        let socket = createConnection({ host, port });

        socket.once('connect', () => {
          socket.end();
          resolve();
        });

        socket.once('error', e => {
          socket.destroy();

          if (e instanceof Error) {
            reject(e);
          } else {
            reject(new Error(String(e)));
          }
        });
      });

      return;
    } catch (e) {
      if (e instanceof Error) {
        lastError = e;
      } else {
        lastError = new Error(String(e));
      }
    }

    await new Promise(resolve => setTimeout(resolve, READY_RETRY_INTERVAL));
  }

  let details = lastError ? ` Last error: ${lastError.message}` : '';
  throw new Error(`Timed out while waiting for ${url} to accept connections after ${timeout}ms.${details}`);
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

  let stdout = await server.start(args.expect, args.timeout);

  let readyURL = extractURL(args.expect);

  if (readyURL) {
    let timeout = args.timeout || DEFAULT_READY_TIMEOUT;

    try {
      await waitForServerReady(readyURL, timeout);
    } catch (e) {
      await server.kill();

      let message = (e instanceof Error) ? e.message : String(e);

      throw new Error(
`${message}

====== STDOUT ======

${server.stdout || '(No output)'}

====== STDERR ======

${server.stderr || '(No output)'}

====================
`
      );
    }
  }

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
