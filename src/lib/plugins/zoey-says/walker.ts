import { BlockContent, Blockquote, HTML } from 'mdast';
import { Position } from 'unist';
import { VFile } from 'vfile';
import BaseWalker from '../../walker';
import html from './markdown-to-html';

const ZOEY_SAYS = 'Zoey says...';

function isZoeySays({ children }: Blockquote): boolean {
  if (children.length === 0) {
    return false;
  }

  let [firstBlock] = children;

  if (firstBlock.type !== 'paragraph') {
    return false;
  }

  let [firstParagraph] = firstBlock.children;

  return firstParagraph.type === 'text' &&
    firstParagraph.value === ZOEY_SAYS;
}

async function render(nodes: BlockContent[], position?: Position): Promise<HTML> {
  let content = [];

  for (let node of nodes) {
    content.push(await html(node));
  }

  let value = `<div class="cta">
  <div class="cta-note">
    <div class="cta-note-body">
      <div class="cta-note-heading">Zoey says...</div>
      <div class="cta-note-message">
        ${content.join('        \n')}
      </div>
    </div>
    <img src="/images/mascots/zoey.png" role="presentation" alt="">
  </div>
</div>`;

  return { type: 'html', value, position };
}

export default class ZoeySaysWalker extends BaseWalker<null> {
  constructor(file: VFile) {
    super(null, file);
  }

  protected async blockquote(node: Blockquote): Promise<Blockquote | HTML> {
    if (isZoeySays(node)) {
      return render(node.children.slice(1), node.position);
    } else {
      return node;
    }
  }
}
