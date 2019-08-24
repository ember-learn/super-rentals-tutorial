import { Plugin, Transformer } from 'unified';
import { Node } from 'unist';
import { VFile } from 'vfile';
import Walker from './walker';

function attacher(): Transformer {
  async function transform(node: Node, file: VFile): Promise<Node> {
    return new Walker(file).walk(node);
  }

  return transform;
}

const plugin: Plugin<[]> = attacher;

export default plugin;
