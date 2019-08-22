import { Code } from 'mdast';
import Options from '../options';

export default async function ignore(_node: Code, _options: Options): Promise<null> {
  return null;
}
