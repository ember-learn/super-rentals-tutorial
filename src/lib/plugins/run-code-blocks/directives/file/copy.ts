import { lstat as _lstat, readFile as _readFile } from 'fs';
import { Code } from 'mdast';
import mkdirp from 'mkdirp';
import { ncp as _ncp } from 'ncp';
import { basename, dirname, join } from 'path';
import { Option } from 'ts-std';
import { promisify } from 'util';
import Options from '../../options';
import parseArgs, { ToBool, optional, required } from '../../parse-args';

const lstat = promisify(_lstat);
const ncp = promisify(_ncp);
const readFile = promisify(_readFile);

interface Args {
  lang?: string;
  hidden?: boolean;
  cwd?: string;
  src: string;
  filename: string;
}

export default async function copyFile(node: Code, options: Options): Promise<Option<Code>> {
  let args = parseArgs<Args>(node, [
    optional('lang', String),
    optional('hidden', ToBool, false),
    optional('cwd', String),
    required('src', String),
    required('filename', String)
  ]);

  let src = join(options.assets, args.src);
  let destDir = options.cwd;
  let destPath: string;

  if (args.cwd) {
    destDir = join(destDir, args.cwd);
  }

  let stats = await lstat(src);
  let isFile = stats.isFile();
  let isDirectory = stats.isDirectory();

  if (isFile) {
    console.log(`$ cp ${join('src', 'assets', args.src)} ${ args.filename }`);
    destDir = join(destDir, dirname(args.filename));
    destPath = join(destDir, basename(args.filename));
  } else if (isDirectory) {
    console.log(`$ cp -r ${join('src', 'assets', args.src)} ${ args.filename }`);
    destDir = destPath = join(destDir, args.filename);
  } else {
    throw new Error(`\`${src}\` is neither a regular file or a directory`);
  }

  await mkdirp(destDir, {});
  await ncp(src, destPath);

  if (args.hidden) {
    return null
  } else {
    let value = node.value;
    let meta: string | undefined;

    if (isFile) {
      value = value || await readFile(destPath, { encoding: 'utf8' });
      meta = `{ data-filename="${args.filename}" }`;
    } else if (isDirectory && !value) {
      throw new Error('TODO: tree output is not yet implemented, see https://github.com/MrRaindrop/tree-cli/issues/15')
    }

    return {
      ...node,
      lang: args.lang,
      meta,
      value: value.trimRight()
    };
  }
}
