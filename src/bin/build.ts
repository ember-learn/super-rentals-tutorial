import {
  readFile as _readFile,
  writeFile as _writeFile
} from 'fs';
import _glob from 'glob';
import _mkdirp from 'mkdirp';
import { ncp as _ncp } from 'ncp';
import { join } from 'path';
import markdown from 'remark-parse';
import stringify from 'remark-stringify';
import _rmrf from 'rimraf'
import unified from 'unified';
import { promisify } from 'util';

import runCodeBlocks from '../lib/plugin';

const glob = promisify(_glob);
const readFile = promisify(_readFile);
const writeFile = promisify(_writeFile);
const rmrf = promisify(_rmrf);
const mkdirp = promisify(_mkdirp);
const ncp = promisify(_ncp);

async function main() {
  let project = process.cwd();
  let assetsDir = join(project, 'dist', 'assets');
  let outDir = join(project, 'dist', 'chapters');
  let codeDir = join(project, 'dist', 'code');

  await rmrf(assetsDir);
  await ncp(join(project, 'src', 'assets'), assetsDir);

  await mkdirp(outDir);
  await rmrf(join(outDir, '*'));

  await mkdirp(codeDir);
  await rmrf(join(codeDir, '*'));

  let chapters = await glob('*.md', {
    cwd: join(project, 'src', 'chapters')
  });

  const processor = unified()
    .use(markdown)
    .use(runCodeBlocks, { cwd: codeDir })
    .use(stringify, { fences: true });

  for (let path of chapters) {
    console.log(`Processing ${path}`);

    let inputPath = join(project, 'src', 'chapters', path);
    let outputPath = join(project, 'dist', 'chapters', path);

    let contents = await readFile(inputPath, { encoding: 'utf8' });

    let result = await processor.process({ path, contents });

    await writeFile(outputPath, result, { encoding: 'utf8' });
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
