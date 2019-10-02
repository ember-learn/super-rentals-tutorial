import { exec as _exec } from 'child_process';
import { Code, Image } from 'mdast';
import _mkdirp from 'mkdirp';
import { basename, extname, join } from 'path';
import { ScreenshotOptions, Viewport } from 'puppeteer';
import { JSONObject, JSONValue, assert } from 'ts-std';
import { promisify } from 'util';
import { VFile } from 'vfile';
import Options from '../options';
import parseArgs, { ToBool, optional, required } from '../parse-args';

const exec = promisify(_exec);
const mkdirp = promisify(_mkdirp);

interface Args {
  filename: string;
  alt: string;
  width: number;
  height?: number;
  x?: number;
  y?: number;
  retina?: boolean;
}

function js(v: JSONValue): string {
  return JSON.stringify(v);
}

function compile(steps: string, path: string, args: Args): string {
  let { width, height, x, y, retina } = args;

  let viewport: Viewport & JSONObject = {
    width,
    height: height || 100,
    deviceScaleFactor: retina ? 2 : 1
  };

  let options: ScreenshotOptions & JSONObject;

  if (height === 0) {
    options = {
      path,
      type: 'png',
      fullPage: true
    };
  } else {
    options = {
      path,
      type: 'png',
      clip: {
        width: width!,
        height: height!,
        x: x!,
        y: y!
      }
    };
  }

  let script = [
`const puppeteer = require('puppeteer');

async function main() {
  let browser = await puppeteer.launch();
  let page = await browser.newPage();
  await page.setViewport(${js(viewport)});
`
  ];

  for (let step of steps.split('\n')) {
    if (step === '' || step.startsWith('#')) {
      continue;
    }

    let [action, arg] = step.split(/\s+/, 2);

    switch (action) {
      case 'click':
        script.push(`  await page.click(${js(arg)});`);
        break;
      case 'eval':
        script.push(`  await page.evaluate(${js(arg)});`);
        break;
      case 'visit':
        script.push(`  await page.goto(${js(arg)}, { waitUtil: 'networkidle0' });`);
        break;
      case 'wait':
        script.push(`  await page.waitForSelector(${js(arg)});`);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  script.push(
`
  await page.$$eval('img', async imgs => {
    for (let img of imgs) {
      if (!img.complete) {
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(\`failed to load \${img.src}\`);
        });
      } else if(img.naturalHeight === 0) {
        return Promise.reject(\`failed to load \${img.src}\`);
      }
    }
  });
  await page.screenshot(${js(options)});
  await browser.close();
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
`
  );

  return script.join('\n');
}

export default async function screenshot(node: Code, options: Options, vfile: VFile): Promise<Image> {
  let args = parseArgs<Args>(node, [
    required('filename', String),
    required('alt', String),
    required('width', Number),
    optional('height', Number, 0),
    optional('x', Number, 0),
    optional('y', Number, 0),
    optional('retina', ToBool, false)
  ]);

  assert(!!vfile.basename, 'unknown basename');
  assert(extname(args.filename) === '.png', `filename must have .png extnsion (${args.filename})`);
  assert(args.width > 0, `width must be positive`);
  assert(args.height !== 0 || (args.x === 0 && args.y === 0), `cannot specify x and y for fullscreen screenshots (height=0)`);

  let namespace = basename(vfile.basename!, '.md');
  let dir = join(options.assets, 'screenshots', namespace);

  let { filename } = args;

  if (args.retina) {
    filename = `${basename(filename, '.png')}@2x.png`;
  }

  await mkdirp(dir);

  let path = join(dir, filename);

  let script = compile(node.value, path, args);

  console.log(`$ node -\n${script.trimRight()}`);

  let p = exec(`node -`);

  p.child.stdin!.write(script, 'utf8');
  p.child.stdin!.end();

  await p;

  let src = `/screenshots/${namespace}/${filename}`;
  let { alt } = args;
  let { position, data } = node;

  return {
    type: 'image',
    url: src,
    alt,
    position,
    data
  };
}
