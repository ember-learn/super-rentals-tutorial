import * as github from '@actions/core';
import chalk from 'chalk';
import {
  readFile as _readFile,
  writeFile as _writeFile
} from 'fs';
import _glob from 'glob';
import mkdirp from 'mkdirp';
import { ncp as _ncp } from 'ncp';
import { basename, dirname, join, relative, sep } from 'path';
import frontmatter from 'remark-frontmatter';
import markdown from 'remark-parse';
import yaml from 'remark-parse-yaml';
import stringify from 'remark-stringify';
import unified, { Processor } from 'unified';
import { promisify } from 'util';
import { VFileOptions } from 'vfile';

import { doNotEdit, retinaImages, runCodeBlocks, todoLinks, zoeySays } from '../lib';

const glob = promisify(_glob);
const readFile = promisify(_readFile);
const writeFile = promisify(_writeFile);
const ncp = promisify(_ncp);

// 01-orientation.md -> orientation.md
function unprefix(path: string): string {
  let parts = path.split(sep);
  parts = parts.map(p => p.replace(/^[0-9]+-/, ''));
  return join(...parts);
}

// Group a related section of the logs. On CI this makes the section foldable.
async function group<T>(name: string, callback: () => Promise<T>): Promise<T> {
  if (process.env.CI) {
    return github.group(name, callback);
  } else {
    console.log(chalk.yellow(name));
    return callback();
  }
}

async function run(processor: Processor, inputPath: string, outputPath: string, options: VFileOptions): Promise<void> {
  let contents = await readFile(inputPath, { encoding: 'utf8' });
  let result = await processor.process({ ...options, contents });
  await writeFile(outputPath, result.toString(), { encoding: 'utf8' });
}

async function main() {
  let project = process.cwd();
  let assetsDir = join(project, 'dist', 'assets');
  let srcDir = join(project, 'src', 'markdown')
  let outDir = join(project, 'dist', 'markdown');
  let codeDir = join(project, 'dist', 'code');

  await ncp(join(project, 'src', 'assets'), assetsDir);
  await mkdirp(outDir, {});
  await mkdirp(codeDir, {});

  let pattern = process.argv[2] || join('src', 'markdown', '**', '*.md');

  let inputPaths = await glob(pattern);

  let processor = unified()
    .use(markdown)
    .use(frontmatter)
    .use(runCodeBlocks, { cfg: process.env.CI ? ['ci'] : [], cwd: codeDir, assets: assetsDir })
    .use(todoLinks)
    .use(zoeySays)
    .use(doNotEdit, { repo: 'ember-learn/super-rentals-tutorial' })
    .use(stringify, { fences: true, listItemIndent: '1' })
    .use(yaml);

  let outputPaths: Map<string, VFileOptions> = new Map();

  for (let inputPath of inputPaths) {
    await group(`Processing ${inputPath}`, async () => {
      let dir = unprefix(relative(srcDir, dirname(inputPath)));
      let name = unprefix(basename(inputPath));

      await mkdirp(join(outDir, dir), {});

      let outputPath = join(outDir, dir, name);

      let options: VFileOptions = {
        path: join(dir, name),
        cwd: outDir,
        data: { originalPath: inputPath }
      }

      outputPaths.set(outputPath, options);

      await run(processor, inputPath, outputPath, options);
    });
  }

  let postProcessor = unified()
    .use(markdown)
    .use(frontmatter)
    .use(retinaImages, { assets: assetsDir })
    .use(stringify, { fences: true, listItemIndent: '1' })
    .use(yaml);

  for (let [outputPath, options] of outputPaths) {
    await group(`Post-processing ${relative(project, outputPath)}`, async () =>
      await run(postProcessor, outputPath, outputPath, options)
    );
  }
}

main().catch(error => {
  if (typeof error === 'string') {
    github.setOutput('error', error);
  } else if ('message' in error && typeof error.message === 'string') {
    if ('stack' in error && typeof error.stack === 'string') {
      if (error.stack.includes(error.message)) {
        github.setOutput('error', error.stack);
      } else {
        github.setOutput('error', error.message + '\n' + error.stack);
      }
    } else {
      github.setOutput('error', error.message);
    }
  } else {
    try {
      github.setOutput('error', JSON.stringify(error));
    } catch {
      // ignore
    }
  }

  console.error(error);
  process.exit(1);
});
