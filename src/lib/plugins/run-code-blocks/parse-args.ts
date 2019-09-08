import { Code } from 'mdast';
import { assert, dict } from 'ts-std';
import ParseError from './parse-error';

export type Transform<From, To> = (input: From) => To;

export type KeyTransform<From, To> = [string, Transform<From, To>];

export function optional<From, To>(key: string, transform: Transform<From, To>, defaultValue?: To): KeyTransform<From | undefined, To | undefined> {
  return [key, input => {
    if (input === undefined) {
      return defaultValue;
    } else {
      return transform(input);
    }
  }];
}

export function required<From, To>(key: string, transform: Transform<From, To>): KeyTransform<From | undefined, To> {
  return [key, input => {
    assert(input !== undefined, `${key} is required`);
    return transform(input!);
  }];
}

export function ToBool(input: string): boolean {
  return input === 'true';
}

export type KeyTransforms = Array<KeyTransform<string | undefined, unknown>>;

export default function parseArgs<Args extends object>(node: Code, transforms: KeyTransforms): Args {
  let { lang, meta } = node;
  let parsed = dict<string>();
  let validKeys = transforms.map(([key]) => key);

  if (meta) {
    let pattern = /(?:^|\s+)(\w+)=(?:([^'"\s]\S*)|(?:"([^"]*)")|(?:'([^']*)'))/g;

    while (pattern.lastIndex < meta.length) {
      let match = pattern.exec(meta);

      if (match === null) {
        throw new ParseError(`invalid arguments for \`${lang}\`: ${meta}`, node);
      }

      let [, key, v1, v2, v3] = match;
      let value = v1 || v2 || v3;

      if (!validKeys.includes(key)) {
        throw new ParseError(`\`${key}\` is not a valid argument for \`${lang}\``, node);
      }

      parsed[key] = value;
    }
  }

  let args = dict() as Partial<Args>;

  for (let [key, transform] of transforms) {
    args[key as keyof Args] = transform!(parsed[key]) as any;
  }

  return args as Args;
}
