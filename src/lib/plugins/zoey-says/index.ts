import { Plugin, Transformer } from 'unified';
import { Node } from 'unist';
import Walker from './walker';

function attacher(): Transformer {
  async function transform(node: Node): Promise<Node> {
    return new Walker().walk(node);
  }

  return transform;
}

const plugin: Plugin<[]> = attacher;

export default plugin;
