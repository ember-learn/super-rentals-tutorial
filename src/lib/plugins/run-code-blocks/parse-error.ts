import LineNo, { start } from './lineno';

export default class ParseError extends Error {
  constructor(reason: string, lineno: LineNo) {
    let line = start(lineno);

    if (line) {
      super(`${reason} (on line ${line})`);
    } else {
      super(reason);
    }
  }
}
