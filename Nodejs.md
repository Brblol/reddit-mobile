Node.js
=======

[Node.js](https://nodejs.org/en/) runs javascript through a V8 runtime-
essentially, javascript out of the browser. In our case, it serves web requests,
builds client-side assets, and runs tests. [[Most of the code is shared|Isomorphism]]
between the server and the browser.

reddit-mobile in production using 4.2.x, the long-term stable release.

Installing
----------

The easiest way, if you're on OSX, is to use [homebrew](http://brew.sh/) -
install, and then `brew install node`. There is documentation for other OSes
on the [Node.js](https://nodejs.org/en/) website.

NPM and Packages
----------------

[NPM, or "Node Package Manager"](https://www.npmjs.com/), is used to install,
update, remove, and create node.js pacakges. By default, it installs all
packages to your project directory in the `node_modules` folder - not a global
directory. (To install something globally, use `npm install -g packagename`).
The packages for a project are installed running `npm install` from that
project's root, or wherever the `package.json` file is. `package.json` is a
manifest file that describes all of the dependencies, and some other meta
information, about a project or package.

Sometimes, you may need to modify a dependency. Rather than modifying the
dependency within `node_modules`, it's better to clone the module somewhere
useful, symlink it to the global module directory with `npm link`, and then
delete the project's local copy from `node_modules`. If a module isn't found
in the local directory, node will look it up in the global directory (you will
need to restart your server / build process to see changes.)
