import { Code } from 'mdast';
import { Option, assert } from 'ts-std';
import { Node } from 'unist';

import checkpoint from './directives/checkpoint';
import command from './directives/command';
import copyFile from './directives/file/copy';
import createFile from './directives/file/create';
import patchFile from './directives/file/patch';
import ignore from './directives/ignore';
import pause from './directives/pause';

import Options from './options';

export default async function run({ lang, meta, value }: Code, options: Options): Promise<Option<Node>> {
  meta = meta || '';

  switch (lang) {
    case 'run:checkpoint':
      return checkpoint(meta, value, options);

    case 'run:command':
      return command(meta, value, options);

    case 'run:file:copy':
      return copyFile(meta, value, options);

    case 'run:file:create':
        return createFile(meta, value, options);

    case 'run:file:patch':
        return patchFile(meta, value, options);

    case 'run:ignore':
        return ignore(meta, value, options);

    case 'run:pause':
        return pause(meta, value, options);

    default:
      if (lang!.startsWith('run:ignore:')) {
        return ignore(meta, value, options);
      } else {
        throw assert(false, `Unknown directive \`${lang}\`.`);
      }
  }
}
