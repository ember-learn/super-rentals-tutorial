import { Option } from 'ts-std';
import { Node } from 'unist';

type LineNo = Option<number | Node>;
export default LineNo;

export function isNumber(lineno: LineNo): lineno is number {
  return typeof lineno === 'number';
}

export function isNode(lineno: LineNo): lineno is Node {
  return lineno !== null && !isNumber(lineno);
}

export function start(lineno: LineNo): Option<number> {
  if (isNumber(lineno)) {
    return lineno;
  } else if (isNode(lineno) && lineno.position) {
    return lineno.position.start.line;
  } else {
    return null;
  }
}

export function end(lineno: LineNo): Option<number> {
  if (isNumber(lineno)) {
    return lineno;
  } else if (isNode(lineno) && lineno.position) {
    return lineno.position.end.line;
  } else {
    return null;
  }
}

export function offset(lineno: LineNo, i: number): Option<number> {
  let v = start(lineno);
  return v === null ? null : v + i;
}
