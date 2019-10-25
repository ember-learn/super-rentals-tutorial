import { Association, HTML, LinkReference, StaticPhrasingContent } from 'mdast';
import { Option } from 'ts-std';
import { VFile } from 'vfile';
import BaseWalker from '../../walker';

const TODO_PREFIX = 'TODO:';

function isLintDirective(node: HTML): boolean {
  return node.value === '<!--lint disable no-undefined-references -->';
}

function isTodoLink(node: LinkReference): boolean {
  // This is a bug in `mdast`.
  // According to the spec, Reference extends Association.
  // https://github.com/DefinitelyTyped/DefinitelyTyped/pull/37882
  let { label } = node as LinkReference & Association;
  return !!label && label.startsWith(TODO_PREFIX);
}

export default class TodoLinksWalker extends BaseWalker<null> {
  constructor(file: VFile) {
    super(null, file);
  }

  protected async html(node: HTML): Promise<Option<HTML>> {
    if (isLintDirective(node)) {
      return null;
    } else {
      return node;
    }
  }

  protected async linkReference(node: LinkReference): Promise<LinkReference | StaticPhrasingContent[]> {
    if (isTodoLink(node)) {
      return node.children;
    } else {
      return node;
    }
  }
}
