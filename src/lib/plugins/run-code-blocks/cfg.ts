import { Option } from 'ts-std';
import ParseError from './parse-error';

export interface ConfigurationPredicate {
  eval(cfg: string[]): boolean;
}

class ConfigurationOption implements ConfigurationPredicate {
  static parse(input: string, lineno: Option<number>): ConfigurationOption {
    if (input === '' || /\(|\)|,/.test(input)) {
      throw new ParseError('expecting a single cfg predicate', lineno);
    }

    return new this(input);
  }

  private constructor(private option: string) {}

  eval(cfg: string[]): boolean {
    return cfg.includes(this.option);
  }
}

class ConfigurationAll implements ConfigurationPredicate {
  static parse(input: string, lineno: Option<number>): Option<ConfigurationAll> {
    let match = /^all\((.+)\)$/.exec(input);

    if (match) {
      return new this(parsePredicates(match[1], lineno));
    } else {
      return null;
    }
  }

  private constructor(private predicates: ConfigurationPredicate[]) {}

  eval(cfg: string[]): boolean {
    return this.predicates.every(p => p.eval(cfg));
  }
}

class ConfigurationAny implements ConfigurationPredicate {
  static parse(input: string, lineno: Option<number>): Option<ConfigurationAny> {
    let match = /^any\((.+)\)$/.exec(input);

    if (match) {
      return new this(parsePredicates(match[1], lineno));
    } else {
      return null;
    }
  }

  private constructor(private predicates: ConfigurationPredicate[]) {}

  eval(cfg: string[]): boolean {
    return this.predicates.some(p => p.eval(cfg));
  }
}

class ConfigurationNot implements ConfigurationPredicate {
  static parse(input: string, lineno: Option<number>): Option<ConfigurationNot> {
    let match = /^not\((.+)\)$/.exec(input);

    if (match) {
      return new this(parse(match[1], lineno));
    } else {
      return null;
    }
  }

  private constructor(private predicate: ConfigurationPredicate) {}

  eval(cfg: string[]): boolean {
    return !this.predicate.eval(cfg);
  }
}

export default function parse(input: string, lineno: Option<number>): ConfigurationPredicate {
  return ConfigurationAll.parse(input, lineno) ||
    ConfigurationAny.parse(input, lineno) ||
    ConfigurationNot.parse(input, lineno) ||
    ConfigurationOption.parse(input, lineno);
}

function parsePredicates(input: string, lineno: Option<number>): ConfigurationPredicate[] {
  let items = input.split(',').map(item => item.trim());

  // Trailing comma
  if (items.length > 0 && items[items.length - 1] === '') {
    items.pop();
  }

  if (items.length === 0) {
    throw new ParseError('expecting at least one cfg predicate', lineno);
  }

  return items.map(item => parse(item, lineno));
}
