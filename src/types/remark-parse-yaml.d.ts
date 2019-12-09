declare module 'remark-parse-yaml' {
  import { Plugin } from 'unified';

  interface ParseYAMLPlugin extends Plugin<[]> {}

  const Plugin: ParseYAMLPlugin;

  export default Plugin;
}
