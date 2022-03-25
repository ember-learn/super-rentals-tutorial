import { Root } from 'mdast';
import { Option, assert } from 'ts-std';
import { Node, Parent } from 'unist';
import { VFile } from 'vfile';

type Handler<Options> = (this: Walker<Options>, node: Node) => Option<Node> | Promise<Option<Node>>;

function isParent(node: Node): node is Parent {
  return Array.isArray((node as Node & { children: unknown }).children);
}

export default class Walker<Options> {
  constructor(protected options: Options, protected file: VFile) { }

  [key: string]: unknown;

  async walk(root: Node): Promise<Root> {
    assert(root.type === 'root', `Cannot walk \`${root.type}\` (must be \`root\`)`);

    let result = await this.handle(root);

    if (Array.isArray(result)) {
      assert(result.length === 1, 'Must return a single root node');
      result = result[0];
    }

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

  protected async handle(node: Node): Promise<Option<Node> | Node[]> {
    let maybeHandler = this[node.type];

    if (typeof maybeHandler === 'function') {
      let handler = maybeHandler as Handler<Options>;
      return handler.call(this, node);
    } else if (isParent(node)) {
      return ({
        ...node,
        children: await this.visit(node.children)
      } as Parent);
    } else {
      return node;
    }
  }

  protected async visit<Type extends Node>(input: Type[]): Promise<Type[]> {
    let output = [];

    for (let node of input) {
      let result = await this.handle(node);

      if (Array.isArray(result)) {
        output.push(...result);
      } else if (result) {
        output.push(result);
      }
    }

    return output as Type[];
  }
}
