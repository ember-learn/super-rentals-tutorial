import { Plugin, Transformer } from 'unified';
import { Node } from 'unist';
import { VFile } from 'vfile';
import Options from './options';
import Walker from './walker';

function attacher(options: Options): Transformer {
  async function transform(node: Node, file: VFile): Promise<Node> {
    return new Walker(options, file).walk(node);
  }

  return transform;
}

const plugin: Plugin<[Options]> = attacher;

export default plugin;
