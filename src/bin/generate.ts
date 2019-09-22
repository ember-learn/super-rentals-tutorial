import {
  readFile as _readFile,
  writeFile as _writeFile
} from 'fs';
import _glob from 'glob';
import _mkdirp from 'mkdirp';
import { ncp as _ncp } from 'ncp';
import { basename, join, relative } from 'path';
import markdown from 'remark-parse';
import stringify from 'remark-stringify';
import unified, { Processor } from 'unified';
import { promisify } from 'util';

import { doNotEdit, retinaImages, runCodeBlocks, todoLinks, zoeySays } from '../lib';

const glob = promisify(_glob);
const readFile = promisify(_readFile);
const writeFile = promisify(_writeFile);
const mkdirp = promisify(_mkdirp);
const ncp = promisify(_ncp);

async function run(processor: Processor, projectPath: string, inputPath: string, outputPath: string): Promise<void> {
  let relativePath = relative(projectPath, inputPath);
  let contents = await readFile(inputPath, { encoding: 'utf8' });
  let result = await processor.process({ path: relativePath, contents });
  await writeFile(outputPath, result, { encoding: 'utf8' });
}

async function main() {
  let project = process.cwd();
  let assetsDir = join(project, 'dist', 'assets');
  let outDir = join(project, 'dist', 'chapters');
  let codeDir = join(project, 'dist', 'code');

  await ncp(join(project, 'src', 'assets'), assetsDir);
  await mkdirp(outDir);
  await mkdirp(codeDir);

  let pattern = process.argv[2] || join('src', 'chapters', '*.md');

  let chapters = await glob(pattern);

  let processor = unified()
    .use(markdown)
    .use(runCodeBlocks, { cfg: process.env.CI ? ['ci'] : [], cwd: codeDir, assets: assetsDir })
    .use(todoLinks)
    .use(zoeySays)
    .use(doNotEdit, { repo: 'ember-learn/super-rentals-tutorial' })
    .use(stringify, { fences: true, listItemIndent: '1' });

  let outputPaths = [];

  for (let inputPath of chapters) {
    console.log(`Processing ${inputPath}`);
    let outputPath = join(project, 'dist', 'chapters', basename(inputPath));
    outputPaths.push(outputPath);
    await run(processor, project, inputPath, outputPath);
  }

  let postProcessor = unified()
    .use(markdown)
    .use(retinaImages, { assets: assetsDir })
    .use(stringify, { fences: true, listItemIndent: '1' });

  for (let outputPath of outputPaths) {
    console.log(`Post-processing ${outputPath}`);
    await run(postProcessor, project, outputPath, outputPath);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
