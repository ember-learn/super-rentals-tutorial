import { Plugin, Transformer } from 'unified';
import { Node } from 'unist';
import Options from './options';
import Walker from './walker';

function attacher(options: Options): Transformer {
  async function transform(node: Node): Promise<Node> {
    let walker = new Walker(options);
    return walker.walk(node);
  }

  return transform;
}

function walk(node: Node): Node {
  return node;
}

const plugin: Plugin<[Options]> = attacher;

export default plugin;
