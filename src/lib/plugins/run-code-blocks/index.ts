import { Plugin, Transformer } from 'unified';
import { Node } from 'unist';
import { VFile } from 'vfile';
import Options from './options';
import Walker from './walker';

function normalizeOptions(options: Options): Options {
  let cfg = [...options.cfg, process.platform];

  if (process.platform === 'win32') {
    cfg.push('windows');
  } else {
    cfg.push('unix');
  }

  return { ...options, cfg };
}

function attacher(options: Options): Transformer {
  async function transform(node: Node, file: VFile): Promise<Node> {
    return new Walker(normalizeOptions(options), file).walk(node);
  }

  return transform;
}

const plugin: Plugin<[Options]> = attacher;

export default plugin;
