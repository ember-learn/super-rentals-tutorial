const { join } = require("path");

module.exports = {
  // Changes the cache location for Puppeteer. See
  // .github/build.yml where we make sure github caches this
  // path. This is necessary because we're caching the PNPM store, and puppeteer
  // will not re-install the browser when it got cached, so we need to make sure
  // the browser gets cached similarly.
  cacheDirectory: join(__dirname, ".puppeteer-cache")
};
