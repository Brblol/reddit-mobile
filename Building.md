Building Assets
===============

reddit-mobile uses [Gulp](http://gulpjs.com/) for client asset compilation.
The build step, `npm run build`, compiles and minifies javascript, css, and
icon fonts.

Tasks
-----

* `npm run build` builds produciton-ready assets. This runs the `less` css
  compiler to build an uncompiled version as well as a compiled version. The
  compiled version is named something like `base-SHA.css`, and the mapping from
  `base.css` to `base-SHA.css` is stored in a manifest file, `css-manifest.json`.
  A similar process is used in javascript (`client.js`, `client.min-SHA.js`, and
  `client-manifest.json`). The filenames with SHAs allow urls to be
  cache-busted; as a new version of the script is available, the browser will
  fetch the latest.
* `npm run watch` runs a process that runs the above steps, with the addition
  that it watches for changes and re-compiles when a css or js file is changed.
  The recompilation process is also much faster (1-2 seconds). If you have the
  `LIVERELOAD` environment variable set to true, it will also cause your
  browser to reload as the file updates.
* `gulp icon-fonts` will take the icons in `assets/icons/*.svg`, compiles a
  webfont file, and updates a less file at `assets/less/_icons.less`. You can
  Then re-compile your less to update, add, or remove icons.

Build tasks live in ./buildTasks, and are defined in ./gulpfile.js.
