import { Plugin, Transformer } from 'unified';
import { Node } from 'unist';
import Options from './options';
import Walker from './walker';

function attacher(options: Options): Transformer {
  async function transform(node: Node): Promise<Node> {
    return new Walker(options).walk(node);
  }

  return transform;
}

const plugin: Plugin<[Options]> = attacher;

export default plugin;
