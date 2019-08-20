import { Dict, assert, dict } from 'ts-std';

export type Transform<From, To> = (input: From) => To;

export type KeyTransform<From, To> = [string, Transform<From, To>];

export function optional<From, To>(key: string, transform: Transform<From, To>, defaultValue?: To): KeyTransform<From | undefined, To | undefined> {
  return [key, input => {
    if (input) {
      return transform(input);
    } else {
      return defaultValue;
    }
  }];
}

export function required<From, To>(key: string, transform: Transform<From, To>): KeyTransform<From | undefined, To> {
  return [key, input => {
    assert(!!input, `${key} is required`);
    return transform(input!);
  }];
}

export type KeyTransforms = Array<KeyTransform<string | undefined, unknown>>;

export default function parse<Args extends object>(directive: string, input: string, transforms: KeyTransforms): Args {
  let parsed = dict<string>();
  let validKeys = transforms.map(([key]) => key);

  if (input) {
    let pairs = input.split(' ');

    for (let pair of pairs) {
      let [key, value, ...extra] = pair.split('=');

      assert(!!key, 'bug: no key?');
      assert(validKeys.includes(key), `\`${key}\` is not a valid argument for \`${directive}\``);
      assert(!!value, `\`${key}\` must have a value (in \`${directive}\`)`);
      assert(extra.length === 0, `\`${key}\` has too many values (in \`${directive}\`)`);

      parsed[key] = value;
    }
  }

  let args = dict() as Partial<Args>;

  for (let [key, transform] of transforms) {
    args[key as keyof Args] = transform!(parsed[key]) as any;
  }

  return args as Args;
}
