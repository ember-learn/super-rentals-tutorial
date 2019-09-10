import { Dict, assert, dict } from 'ts-std';
import Server from './server';

export type ServersCallback<T = void> = (servers: Servers) => T | Promise<T>;

export default class Servers {
  static async run<T>(callback: ServersCallback<T>): Promise<T> {
    let servers = new Servers();
    let result: T;
    let error;

    try {
      result = await callback(servers);
    } catch (e) {
      error = e;
    } finally {
      let unstopped = await servers.killAll();

      if (unstopped.length > 0) {
        error = error || new Error(
          'The following server(s) were not shutdown properly.\n\n' +
          unstopped.map(({ id }) => `- ${id}`).join('\n') + '\n\n' +
          'Did you forget to include a `run:server:stop`?'
        );
      }
    }

    if (error) {
      throw error;
    } else {
      return result!;
    }
  }

  private storage: Dict<Server> = dict();

  private constructor() {}

  add(id: string, cmd: string, cwd: string): Server {
    let server = this.storage[id];

    if (server) {
      if (server.pid) {
        assert(false, `server \`${id}\` already exists (pid ${server.pid})`);
      } else {
        assert(false, `server \`${id}\` already exists`);
      }
    }

    return this.storage[id] = new Server(id, cmd, cwd);
  }

  has(id: string): boolean {
    return id in this.storage;
  }

  fetch(id: string): Server {
    assert(this.has(id), `server \`${id}\` does not exist`);
    return this.storage[id]!;
  }

  remove(id: string): Server {
    let server = this.fetch(id);
    delete this.storage[id];
    return server;
  }

  private async killAll(): Promise<Server[]> {
    let { storage } = this;
    this.storage = dict();

    let servers = Object.values(storage).map(s => s!);
    let promises = servers.map(s => s.kill());

    for (let p of promises) {
      await p;
    }

    return servers;
  }
}
