import { Code, Root } from 'mdast';
import { Option, assert } from 'ts-std';
import { Node, Parent } from 'unist';
import Options from './options';
import run from './run';

type Handler = (this: Walker, node: Node) => Option<Node>;

function isParent(node: Node): node is Parent {
  return Array.isArray(node.children);
}

export default class Walker {
  constructor(private options: Options) {}

  [key: string]: unknown;

  async walk(root: Node): Promise<Root> {
    assert(root.type === 'root', `Cannot walk \`${root.type}\` (must be \`root\`)`);

    let result = await this.handle(root);

    if (result) {
      assert(result.type === 'root', 'Must return a root');
      return result as Root;
    } else {
      return {
        type: 'root',
        children: []
      };
    }
  }

  private async handle(node: Node): Promise<Option<Node>> {
    let maybeHandler = this[node.type];

    if (typeof maybeHandler === 'function') {
      let handler = maybeHandler as Handler;
      return handler.call(this, node);
    } else if (isParent(node)) {
      return this.visit(node);
    } else {
      return node;
    }
  }

  private async visit<Type extends Parent>(node: Type): Promise<Type> {
    let children = [];

    for (let child of node.children) {
      let result = await this.handle(child);

      if (result) {
        children.push(result);
      }
    }

    return { ...node, children };
  }

  private async code(node: Code): Promise<Option<Node>> {
    if (node.lang && node.lang.startsWith('run:')) {
      return run(node, this.options);
    } else {
      return node;
    }
  }
}
