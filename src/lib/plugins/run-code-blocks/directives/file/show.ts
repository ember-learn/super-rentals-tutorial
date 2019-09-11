import { lstat as _lstat, readFile as _readFile } from 'fs';
import { Code } from 'mdast';
import { join } from 'path';
import { Option } from 'ts-std';
import { promisify } from 'util';
import Options from '../../options';
import parseArgs, { optional, required } from '../../parse-args';

const lstat = promisify(_lstat);
const readFile = promisify(_readFile);

interface Args {
  lang?: string;
  cwd?: string;
  filename: string;
}

export default async function showFile(node: Code, options: Options): Promise<Option<Code>> {
  let args = parseArgs<Args>(node, [
    optional('lang', String),
    optional('cwd', String),
    required('filename', String)
  ]);

  let dir = options.cwd;

  if (args.cwd) {
    dir = join(dir, args.cwd);
  }

  let path = join(dir, args.filename);

  let stats = await lstat(path);
  let isFile = stats.isFile();
  let isDirectory = stats.isDirectory();

  let meta: string | undefined;
  let value: string;

  if (isFile) {
    console.log(`$ cat ${path}`);
    meta = `{ data-filename="${args.filename}" }`;
    value = await readFile(path, { encoding: 'utf8' });
  } else if (isDirectory) {
    console.log(`$ tree ${path}`);
    throw new Error('TODO: tree output is not yet implemented, see https://github.com/MrRaindrop/tree-cli/issues/15')
  } else {
    throw new Error(`\`${path}\` is neither a regular file or a directory`);
  }

  return {
    ...node,
    lang: args.lang,
    meta,
    value: value.trimRight()
  };
}
