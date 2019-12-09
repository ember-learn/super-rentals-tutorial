declare module 'remark-frontmatter' {
  import { Content } from 'mdast';
  import { Plugin } from 'unified';

  type Preset = 'yaml' | 'toml';

  type Delimiter = string | { open: string, close: string };

  type Matter = {
    type: Content['type'],
    marker: Delimiter,
    anywhere?: boolean
  } | {
    type: Content['type'],
    fence: Delimiter,
    anywhere?: boolean
  };

  type Option = Preset | Matter;

  interface FrontmatterPlugin extends Plugin<[Option?]> {}

  const Plugin: FrontmatterPlugin;

  export default Plugin;
}
