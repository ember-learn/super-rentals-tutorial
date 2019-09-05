import { Code, Root } from 'mdast';
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
import startServer from './directives/server/start';
import stopServer from './directives/server/stop';

import Options from './options';
import Servers from './servers';

export default class Walker extends BaseWalker<Options> {
  private servers: Option<Servers> = null;

  protected async root(node: Root): Promise<Root> {
    assert(this.servers === null, 'servers must be null');

    return Servers.run(async servers => {
      try {
        this.servers = servers;

        let children = await this.visit(node.children);

        assert(this.servers !== null, 'servers cannot be null');
        assert(servers === this.servers, 'servers re-assigned');

        return { ...node, children };
      } finally {
        this.servers = null;
      }
    });
  }

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
          return pause(node, options, this.file);

      case 'run:server:start':
          assert(this.servers !== null, 'servers must not be null');
          return startServer(node, options, this.servers!);

      case 'run:server:stop':
          assert(this.servers !== null, 'servers must not be null');
          return stopServer(node, options, this.servers!);

      default:
        if (lang.startsWith('run:ignore:')) {
          return ignore(node, options);
        } else {
          throw assert(false, `Unknown directive \`${lang}\`.`);
        }
    }
  }
}
