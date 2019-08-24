import { HTML, Root } from 'mdast';
import BaseWalker from '../../walker';
import Options from './options';

function comment(repo: string, branch?: string, path?: string): HTML {
  let url = `https://github.com/${repo}`;

  if (path) {
    branch = branch || 'master';
    url = `${url}/blob/${branch}/${path}`;
  }

  let message = `Heads up! This is a generated file, do not edit directly. You can find the source at ${url}`;

  return {
    type: 'html',
    value: `<!-- ${message} -->`
  };
}

export default class DoNotEditWalker extends BaseWalker<Options> {
  protected async root(node: Root): Promise<Root> {
    let { repo, branch } = this.options;
    let { path } = this.file;

    return {
      ...node,
      children: [
        comment(repo, branch, path),
        ...node.children
      ]
    };
  }
}
