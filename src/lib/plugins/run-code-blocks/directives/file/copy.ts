import { readFile as _readFile } from 'fs';
import { Code } from 'mdast';
import _mkdirp from 'mkdirp';
import { ncp as _ncp } from 'ncp';
import { basename, dirname, join } from 'path';
import { Option } from 'ts-std';
import { promisify } from 'util';
import Options from '../../options';
import parseArgs, { ToBool, optional, required } from '../../parse-args';

const readFile = promisify(_readFile);
const mkdirp = promisify(_mkdirp);
const ncp = promisify(_ncp);

interface Args {
  lang?: string;
  hidden?: boolean;
  cwd?: string;
  src: string;
  filename: string;
}

export default async function copyFile(meta: string, content: string, options: Options): Promise<Option<Code>> {
  let args = parseArgs<Args>('file:copy', meta, [
    optional('lang', String),
    optional('hidden', ToBool),
    optional('cwd', String),
    required('src', String),
    required('filename', String)
  ]);

  console.log(`$ cp ${join('src', 'assets', args.src)} ${ args.filename }`);

  let src = join(options.cwd, '..', 'assets', args.src);

  let destDir = options.cwd;

  if (args.cwd) {
    destDir = join(destDir, args.cwd);
  }

  destDir = join(destDir, dirname(args.filename));

  await mkdirp(destDir);

  let destPath = join(destDir, basename(args.filename));

  await ncp(src, destPath);

  if (args.hidden) {
    return null
  } else {
    let value = content || await readFile(destPath, { encoding: 'utf8' });

    return {
      type: 'code',
      lang: args.lang,
      meta: `{ data-filename="${args.filename}" }`,
      value: value.trimRight()
    };
  }
}
