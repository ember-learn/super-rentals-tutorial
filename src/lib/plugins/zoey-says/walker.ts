import { BlockContent, Blockquote, HTML } from 'mdast';
import { Position } from 'unist';
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
    <img src="/images/mascots/zoey.png" role="presentation" alt="Ember Mascot">
  </div>
</div>`;

  return { type: 'html', value, position };
}

export default class Walker extends BaseWalker<null> {
  constructor() {
    super(null);
  }

  protected async blockquote(node: Blockquote): Promise<Blockquote | HTML> {
    if (isZoeySays(node)) {
      return render(node.children.slice(1), node.position);
    } else {
      return node;
    }
  }
}
