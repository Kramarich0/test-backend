/**
 * Webpack-resolve config used by dependency-cruiser (options.webpackConfig).
 *
 * Why it exists:
 *  - Source files import via the `#` alias (tsconfig paths: `#*` -> `./src/*`),
 *    while package.json `imports` maps `#*` -> `./dist/*` for the compiled output.
 *  - enhanced-resolve treats `#` specifiers as "internal" imports and resolves
 *    them through package.json `imports` *before* tsconfig paths. As soon as a
 *    built `dist/` directory is present, `#common/...` & co. resolve to dist
 *    files, so `src/common/**` falls out of the cruise graph (orphans /
 *    unreachable-from-entry violations).
 *  - The `alias` here rewrites `#...` -> `<repo>/src/...` during the "raw-resolve"
 *    phase, i.e. before the imports field is consulted, so the analysis always
 *    looks at the actual sources regardless of whether `dist/` exists.
 *  - `extensionAlias` maps the ESM-style `.js` specifiers used in source imports
 *    back to the `.ts` files.
 */
const path = require('node:path');

/** @type {import('enhanced-resolve').ResolveOptions} */
module.exports = {
  resolve: {
    alias: {
      '#*': path.join(__dirname, 'src/*'),
    },
    extensionAlias: {
      '.js': ['.ts'],
    },
  },
};
