import { Code } from 'mdast';
import { Option, assert } from 'ts-std';
import { Node } from 'unist';

import BaseWalker from '../../walker';

import checkpoint from './directives/checkpoint';
import command from './directives/command';
import copyFile from './directives/file/copy';
import createFile from './directives/file/create';
import patchFile from './directives/file/patch';
import ignore from './directives/ignore';
import pause from './directives/pause';

import Options from './options';

export default class Walker extends BaseWalker<Options> {
  protected async code(node: Code): Promise<Option<Node>> {
    let { lang } = node;

    if (!lang || !lang.startsWith('run:')) {
      return node;
    }

    let { options } = this;

    switch (lang) {
      case 'run:checkpoint':
        return checkpoint(node, options);

      case 'run:command':
        return command(node, options);

      case 'run:file:copy':
        return copyFile(node, options);

      case 'run:file:create':
          return createFile(node, options);

      case 'run:file:patch':
          return patchFile(node, options);

      case 'run:ignore':
          return ignore(node, options);

      case 'run:pause':
          return pause(node, options);

      default:
        if (lang.startsWith('run:ignore:')) {
          return ignore(node, options);
        } else {
          throw assert(false, `Unknown directive \`${lang}\`.`);
        }
    }
  }
}
