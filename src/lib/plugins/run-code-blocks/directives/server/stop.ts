import { Code } from 'mdast';
import { parseCommand } from '../../commands';
import Options from '../../options';
import parseArgs, { optional } from '../../parse-args';
import Servers from '../../servers';

interface Args {
  id?: string;
}

export default async function stopServer(node: Code, options: Options, servers: Servers): Promise<null> {
  let args = parseArgs<Args>(node, [
    optional('id', String)
  ]);

  let id = args.id || parseCommand(node.value, options.cfg, node).display;
  let server = servers.remove(id);

  try {
    console.log(`$ kill ${server.pid}`);
    await server.stop();
  } catch (error) {
    await server.kill();
    throw error;
  }

  return null;
}
