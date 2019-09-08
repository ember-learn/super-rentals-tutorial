import { Option } from 'ts-std';
import parseCfg, { ConfigurationPredicate } from './cfg';
import LineNo, { end, offset } from './lineno';
import ParseError from './parse-error';

export class Command {
  constructor(readonly command: string, readonly display: string) {}
}

interface PartialCommand {
  cfg?: ConfigurationPredicate;
  display?: string;
  command?: string;
}

export function parseCommands(input: string, cfg: string[], lineno: LineNo): Command[] {
  let commands: Command[] = [];

  let current: Option<PartialCommand> = null;

  let initialize = (): PartialCommand => {
    if (current === null) {
      current = {};
    }

    return current;
  };

  let finalize = (ln: LineNo) => {
    if (!current) {
      return;
    }

    if (current.command === undefined) {
      throw new ParseError('expecting command', ln);
    }

    if (current.command.trimRight().endsWith('\\')) {
      throw new ParseError('expecting command (invalid line-continuation)', ln);
    }

    if (current.cfg && !current.cfg.eval(cfg)) {
      current = null;
      return;
    }

    commands.push(new Command(current.command, current.display || current.command));
    current = null;
  };

  let lines = input.split('\n');

  for (let [i, line] of lines.entries()) {
    let ln = offset(lineno, i + 1);

    if (line.trim() === '') {
      finalize(ln);
      continue;
    }

    let config = /^#\[cfg\((.+)\)\]$/.exec(line);

    if (config) {
      let partial = initialize();

      if (partial.cfg !== undefined) {
        throw new ParseError('only one `#[cfg(...)]` allowed per command', ln);
      }

      partial.cfg = parseCfg(config[1], ln);

      continue;
    }

    let display = /^#\[display\((.+)\)\]$/.exec(line);

    if (display) {
      let partial = initialize();

      if (partial.display !== undefined) {
        throw new ParseError('only one `#[display(...)]` allowed for each command', ln);
      }

      partial.display = display[1];

      continue;
    }

    let unknown = /^#\[.+\]$/.exec(line);

    if (unknown) {
      throw new ParseError(`invalid directive \`${line}\``, ln);
    }

    if (line.startsWith('#')) {
      finalize(ln);
      continue;
    }

    {
      let partial = initialize();

      if (partial.command) {
        partial.command = `${partial.command}\n${line}`;
      } else {
        partial.command = line;
      }

      if (!partial.command.trimRight().endsWith('\\')) {
        finalize(ln);
      }
    }
  }

  finalize(lines.length);

  return commands;
}

export function parseCommand(input: string, cfg: string[], lineno: LineNo): Command {
  let commands = parseCommands(input, cfg, lineno);

  if (commands.length === 1) {
    return commands[0];
  } else {
    throw new ParseError(`expecting exactly 1 command, got ${commands.length}`, end(lineno));
  }
}
