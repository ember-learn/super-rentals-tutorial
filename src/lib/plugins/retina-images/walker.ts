import { exists as _exists } from 'fs';
import _imageSize from 'image-size';
import { HTML, Image } from 'mdast';
import { basename, resolve } from 'path';
import { expect } from 'ts-std';
import { promisify } from 'util';
import BaseWalker from '../../walker';
import Options from './options';

const exists = promisify(_exists);
const imageSize = promisify(_imageSize);

function pathFor(src: string, options: Options): string {
  return resolve(options.assets, `.${src}`);
}

async function isRetinaImage(src: string, options: Options): Promise<boolean> {
  return basename(src, '.png').endsWith('@2x') &&
    src.startsWith('/') &&
    await exists(pathFor(src, options));
}

function attr(v: unknown): string {
  let escaped = String(v).replace(/[<>"]/g, c => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        throw new Error(`Unknown character: \`${c}\``);
    }
  });

  return JSON.stringify(escaped);
}


async function toImgTag(node: Image, options: Options): Promise<HTML> {
  let sizeOfImage = await imageSize(pathFor(node.url, options));

  let size = expect(sizeOfImage, 'size should be present');
  let width = expect(size.width, 'width should be present');
  let height = expect(size.height, 'height should be present');

  let widthAttr = Math.floor(width / 2);
  let heightAttr = Math.floor(height / 2);

  let attrs = [];

  attrs.push(`src=${attr(node.url)}`);

  if (node.alt) {
    attrs.push(`alt=${attr(node.alt)}`);
  }

  if (node.title) {
    attrs.push(`title=${attr(node.title)}`);
  }

  attrs.push(`width=${attr(widthAttr)}`);
  attrs.push(`height=${attr(heightAttr)}`);

  return {
    type: 'html',
    value: `<img ${attrs.join(' ')}>`,
    position: node.position,
    data: node.data
  };
}

export default class RetinaImages extends BaseWalker<Options> {
  protected async image(node: Image): Promise<Image | HTML> {
    if (await isRetinaImage(node.url, this.options)) {
      return toImgTag(node, this.options);
    } else {
      return node;
    }
  }
}
