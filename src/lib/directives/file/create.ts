import { writeFile as _writeFile } from 'fs';
import { Code } from 'mdast';
import _mkdirp from 'mkdirp';
import { basename, dirname, join } from 'path';
import { Option } from 'ts-std';
import { promisify } from 'util';
import Options from '../../options';
import parseArgs, { ToBool, optional, required } from '../../parse-args';

const mkdirp = promisify(_mkdirp);
const writeFile = promisify(_writeFile);

interface Args {
  lang?: string;
  hidden?: boolean;
  cwd?: string;
  filename: string;
}

export default async function createFile(meta: string, content: string, options: Options): Promise<Option<Code>> {
  let args = parseArgs<Args>('file:create', meta, [
    optional('lang', String),
    optional('hidden', ToBool),
    optional('cwd', String),
    required('filename', String)
  ]);

  console.log(`Creating file \`${args.filename}\``);

  let dir = options.cwd;

  if (args.cwd) {
    dir = join(dir, args.cwd);
  }

  dir = join(dir, dirname(args.filename));

  await mkdirp(dir);

  let path = join(dir, basename(args.filename));

  if (!content.endsWith('\n')) {
    content = `${content}\n`;
  }

  await writeFile(path, content, { encoding: 'utf8' });

  if (args.hidden) {
    return null;
  } else {
    return {
      type: 'code',
      lang: args.lang,
      meta: `{ data-filename="${args.filename}" }`,
      value: content.trimRight()
    };
  }
}
