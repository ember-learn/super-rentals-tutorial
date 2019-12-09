import { HTML, Root } from 'mdast';
import { Option } from 'ts-std';
import { VFile } from 'vfile';

import BaseWalker from '../../walker';
import Options from './options';

function makeComment(repo: string, branch?: string, path?: string): HTML {
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
    let originalPath = originalPathFor(this.file);

    if (originalPath === null) {
      return node;
    }

    let comment = makeComment(repo, branch, originalPath);

    if (hasFrontMatter(node)) {
      let [frontMatter, ...rest] = node.children;

      return {
        ...node,
        children: [frontMatter, comment, ...rest]
      };
    } else {
      return {
        ...node,
        children: [comment, ...node.children]
      };
    }
  }
}

function hasData(file: VFile): file is VFile & { data: { [key: string]: any } } {
  return typeof file.data === 'object' && file.data !== null;
}

function originalPathFor(file: VFile): Option<string> {
  if (hasData(file) && typeof file.data.originalPath === 'string') {
    return file.data.originalPath;
  } else {
    return null;
  }
}

function hasFrontMatter(node: Root): boolean {
  return node.children.length > 0 && node.children[0].type === 'yaml';
}
