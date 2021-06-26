import { Heading, Root } from 'mdast';
import markdown from 'remark-parse';
import stringify from 'remark-stringify';
import { Option, assert } from 'ts-std';
import unified from 'unified';
import { Node, Parent } from 'unist';
import { VFile } from 'vfile';


type Handler<Options> = (this: Walker<Options>, node: Node) => Option<Node> | Promise<Option<Node>>;

function isParent(node: Node): node is Parent {
  return Array.isArray(node.children);
}

const Printer = unified().use(markdown).use(stringify);

export default class Walker<Options> {
  private lastNode: Option<Node> = null;
  private lastHeading: Option<Heading> = null;

  constructor(protected options: Options, protected file: VFile) {}

  [key: string]: unknown;

  async walk(root: Node): Promise<Root> {
    assert(root.type === 'root', `Cannot walk \`${root.type}\` (must be \`root\`)`);

    try {
      this.lastNode = null;
      this.lastHeading = null;

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
    } catch (error) {
      let message: string = 'Encounted an error';

      if (this.file.path) {
        message += ` while processing ${this.file.path}`;
      }

      if (this.lastNode?.position) {
        let { line, column } = this.lastNode.position.start;
        message += ` at L${line}:C${column}`;
      }

      if (this.lastHeading) {
        try {
          let heading = Printer.stringify(this.lastHeading);
          message += ` (under the section "${heading}")`;
        } catch {
          // ignore
        }
      }

      if (typeof error === 'string') {
        message += `.\nReason:\n${error}`;
      } else if ('message' in error && typeof error.message === 'string') {
        if ('stack' in error && typeof error.stack === 'string') {
          if (error.stack.includes(error.message)) {
            message += `.\nReason:\n${error.stack}`;
          } else {
            message += `.\nReason:\n${error.message}\n${error.stack}`;
          }
        } else {
          message += `.\nReason:\n${error.message}`;
        }
      }

      let reason: Error | string;

      if ('stack' in error && typeof error.stack === 'string') {
        reason = new Error(message);

        if (error.stack.includes(error.message)) {
          reason.stack = error.stack.replace(error.message, message);
        } else {
          reason.stack = error.stack;
        }
      } else {
        reason = message;
      }

      // upstream type for reason is wrong: should be Error | string
      this.file.fail(reason as string, this.lastNode?.position);
    } finally {
      this.lastNode = null;
      this.lastHeading = null;
    }
  }

  protected async handle(node: Node): Promise<Option<Node> | Node[]> {
    this.lastNode = node;

    if (node.type === 'heading') {
      this.lastHeading = node as Heading;
    }

    let maybeHandler = this[node.type];

    if (typeof maybeHandler === 'function') {
      let handler = maybeHandler as Handler<Options>;
      return handler.call(this, node);
    } else if (isParent(node)) {
      return {
        ...node,
        children: await this.visit(node.children)
      };
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
