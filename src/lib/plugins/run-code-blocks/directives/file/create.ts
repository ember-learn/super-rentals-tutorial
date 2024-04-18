import { writeFile as _writeFile } from 'fs';
import { Code } from 'mdast';
import mkdirp from 'mkdirp';
import { basename, dirname, join } from 'path';
import { Option } from 'ts-std';
import { promisify } from 'util';
import Options from '../../options';
import parseArgs, { ToBool, optional, required } from '../../parse-args';

const writeFile = promisify(_writeFile);

interface Args {
  lang?: string;
  hidden?: boolean;
  cwd?: string;
  filename: string;
}

export default async function createFile(node: Code, options: Options): Promise<Option<Code>> {
  let args = parseArgs<Args>(node, [
    optional('lang', String),
    optional('hidden', ToBool, false),
    optional('cwd', String),
    required('filename', String)
  ]);

  let content = node.value;

  console.log(`$ cat - > ${args.filename}\n${content}`);

  let dir = options.cwd;

  if (args.cwd) {
    dir = join(dir, args.cwd);
  }

  dir = join(dir, dirname(args.filename));

  await mkdirp(dir, {});

  let path = join(dir, basename(args.filename));

  if (!content.endsWith('\n')) {
    content = `${content}\n`;
  }

  await writeFile(path, content, { encoding: 'utf8' });

  if (args.hidden) {
    return null;
  } else {
    return {
      ...node,
      lang: args.lang,
      meta: `{ data-filename="${args.filename}" }`,
      value: content.trimRight()
    };
  }
}
