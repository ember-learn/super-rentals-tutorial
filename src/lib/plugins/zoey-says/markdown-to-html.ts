import unified from 'unified';
import { Node } from 'unist';

// @ts-ignore
import html from 'rehype-stringify';
// @ts-ignore
import rehype from 'remark-rehype';

const processor = unified()
  .use(rehype)
  .use(html);

export default async function markdownToHTML(node: Node): Promise<string> {
  let rehyped = await processor.run(node);
  return processor.stringify(rehyped);
}
