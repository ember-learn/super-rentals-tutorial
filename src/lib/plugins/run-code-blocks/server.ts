import { ChildProcess, spawn } from 'child_process';
import { Option, assert } from 'ts-std';

const WINDOWS = process.platform === 'win32';

export enum Status {
  Starting = 'STARTING',
  Started = 'STARTED',
  Stopping = 'STOPPING',
  Stopped = 'STOPPED'
}

export default class Server {
  private status: Status = Status.Stopped;
  private process: Option<ChildProcess> = null;
  private promise: Option<Promise<void>> = null;
  private _stdout: string[] = [];
  private _stderr: string[] = [];

  constructor(
    readonly id: string,
    private cmd: string,
    private cwd: string
  ) {
    // TODO
  }

  get pid(): Option<number> {
    return this.process && this.process.pid;
  }

  get stdout(): Option<string> {
    let { _stdout } = this;

    if (_stdout.length === 0) {
      return null;
    } else {
      return _stdout.join('').trimRight();
    }
  }

  get stderr(): Option<string> {
    let { _stderr } = this;

    if (_stderr.length === 0) {
      return null;
    } else {
      return _stderr.join('').trimRight();
    }
  }

  async start(expect: Option<string> = null, timeout: Option<number> = null): Promise<Option<string>> {
    assert(this.status === Status.Stopped, `Cannot start server \`${this.id}\` since it is in the ${this.status} state`);
    assert(this.process === null, `this.process was not null (${this.process})`);
    assert(this.promise === null, `this.process was not null (${this.promise})`);

    this.status = Status.Starting;
    this._stdout = [];
    this._stderr = [];

    let { id, cmd, cwd } = this;

    let process = this.process = spawn(cmd, {
      cwd,
      shell: true,
      // On Windows, if we set this to true, the stdio pipes do not work
      detached: !WINDOWS
    });

    return new Promise<Option<string>>((resolveStart, rejectStart) => {
      let settled = false;

      let didComplete: Option<() => void> = null;
      let didFail: Option<(error: Error) => void> = null;

      let didStart = () => {
        assert(this.status === Status.Starting, `Not in STARTING state: ${this.status}`);
        assert(this.process === process, `this.process was reassigned`);
        assert(this.promise === null, `this.process was not null (${this.promise})`);
        assert(!settled, 'cannot resolve, already settled');

        settled = true;

        this.status = Status.Started;
        this.promise = new Promise((resolveStop, rejectStop) => {
          didComplete = () => {
            this.status = Status.Stopped;
            this.process = null;
            this.promise = null;

            resolveStop();
          };

          didFail = error => {
            this.status = Status.Stopped;
            this.process = null;
            this.promise = null;

            rejectStop(error);
          };
        });

        resolveStart(this.stdout);
      };

      let didFailToStart = async (error: Error) => {
        assert(this.status === Status.Starting, `Not in STARTING state: ${this.status}`);
        assert(this.process === process, `this.process was reassigned`);
        assert(!settled, 'cannot resolve, already settled');

        settled = true;

        this.status = Status.Stopped;
        this.process = null;
        this.promise = null;

        await this.kill();

        rejectStart(error);
      };

      process.stdout.on('data', chunk => {
        assert(this.process === null || this.process === process, `this.process was reassigned`);
        this._stdout.push(chunk);

        if (expect && this.status === Status.Starting) {
          if (this.stdout!.includes(expect)) {
            didStart();
          }
        }
      });

      process.stderr.on('data', chunk => {
        assert(this.process === null || this.process === process, `this.process was reassigned`);
        this._stderr.push(chunk);
      });

      process.on('exit', (code, signal) => {
        assert(this.process === process, `this.process was reassigned`);

        let { status } = this;

        // On Windows, we can only forcefully terminate at the moment
        if (status === Status.Stopping && (WINDOWS || code === 0 || signal === 'SIGTERM')) {
          assert(didComplete !== null, 'didComplete must not be null');
          didComplete!();
        } else {
          let reason = (code === null)
            ? `killed with ${signal}`
            : `exited with exit code ${code}`;

          let error = new Error(
`Server \`${id}\` unexpectedly ${reason} while in ${status} state!

====== STDOUT ======

${this.stdout || '(No output)'}

====== STDOUT ======

${this.stderr || '(No output)'}

====================
`
          );

          if (status === Status.Starting) {
            didFailToStart(error);
          } else {
            assert(didFail !== null, 'didFail must not be null');
            didFail!(error);
          }
        }
      });

      if (timeout) {
        setTimeout(() => {
          assert(this.process === process, `this.process was reassigned`);

          if (this.status === Status.Starting) {
            if (expect) {
              didFailToStart(new Error(
`Timed out while waiting for server \`${id}\` to start.
Expecting to find \`${expect}\` from STDOUT, gave up after ${timeout} seconds.

====== STDOUT ======

${this.stdout || '(No output)'}

====== STDOUT ======

${this.stderr || '(No output)'}

====================
`
              ));
            } else {
              didStart();
            }
          }
        }, timeout);
      }

      if (!expect && !timeout) {
        setTimeout(didStart, 0);
      }
    });
  }

  async stop(): Promise<void> {
    assert(this.status === Status.Started, `Cannot stop server \`${this.id}\` since it is in the ${this.status} state`);
    assert(this.pid !== null, `Unknown pid for server \`${this.id}\``);

    this.status = Status.Stopping;
    this.sendKill();

    await this.promise;
  }

  async kill(): Promise<void> {
    let { pid, promise } = this;

    if (pid) {
      this.status = Status.Stopping;
      this.sendKill(true);

      if (promise) {
        try {
          await promise;
        } catch {
          // ignore
        }
      }
    }
  }

  private sendKill(force = false) {
    assert(this.pid !== null, 'pid cannot be null');

    let pid = this.pid!;

    if (WINDOWS) {
      // On Windows, we can only forcefully terminate at the moment
      spawn('taskkill', ['/pid', `${pid}`, '/t', '/f']);
    } else {
      process.kill(-pid, force ? 'SIGKILL' : 'SIGTERM');
    }
  }
}
