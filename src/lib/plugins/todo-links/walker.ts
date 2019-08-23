import { Association, LinkReference, StaticPhrasingContent } from 'mdast';
import BaseWalker from '../../walker';

const TODO_PREFIX = 'TODO:';

function isTodoLink(node: LinkReference): boolean {
  // This is a bug in `mdast`.
  // According to the spec, Reference extends Association.
  // https://github.com/DefinitelyTyped/DefinitelyTyped/pull/37882
  let { label } = node as LinkReference & Association;
  return !!label && label.startsWith(TODO_PREFIX);
}

export default class TodoLinksWalker extends BaseWalker<null> {
  constructor() {
    super(null);
  }

  protected async linkReference(node: LinkReference): Promise<LinkReference | StaticPhrasingContent[]> {
    if (isTodoLink(node)) {
      return node.children;
    } else {
      return node;
    }
  }
}
