import { Root } from 'mdast';
import { Option, assert } from 'ts-std';
import { Node, Parent } from 'unist';

type Handler<Options> = (this: Walker<Options>, node: Node) => Option<Node>;

function isParent(node: Node): node is Parent {
  return Array.isArray(node.children);
}

export default class Walker<Options> {
  constructor(protected options: Options) {}

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

  protected async handle(node: Node): Promise<Option<Node>> {
    let maybeHandler = this[node.type];

    if (typeof maybeHandler === 'function') {
      let handler = maybeHandler as Handler<Options>;
      return handler.call(this, node);
    } else if (isParent(node)) {
      return this.visit(node);
    } else {
      return node;
    }
  }

  protected async visit<Type extends Parent>(node: Type): Promise<Type> {
    let children = [];

    for (let child of node.children) {
      let result = await this.handle(child);

      if (result) {
        children.push(result);
      }
    }

    return { ...node, children };
  }
}
