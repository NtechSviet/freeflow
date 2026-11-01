'use strict';
// Portable mode: keep the profile (settings, dictionary, history, notes,
// meetings, logs) and the voice model next to the executable, so FreeFlow can run
// from any folder - a USB stick, an external drive, a synced folder - without
// writing anything to %APPDATA% / %LOCALAPPDATA%.
//
// Turning it on is a file, no setting to find: `portable.txt` (empty) next to
// FreeFlow.exe. The `data` folder counts too, so a portable install keeps working
// after the marker is lost, and `FreeFlow Portable` covers a renamed folder that
// carries the marker under that name.
const fs = require('fs');
const path = require('path');

const MARKERS = ['portable.txt', 'data', 'FreeFlow Portable'];

// Folder holding the executable. Inside a .app bundle the executable lives in
// Foo.app/Contents/MacOS, so the folder a user can drop a marker into is the one
// that contains Foo.app.
function appDir(execPath) {
  const dir = path.dirname(execPath);
  const bundle = dir.match(/^(.*)\.app[\\/]Contents[\\/]MacOS$/i);
  return bundle ? path.dirname(bundle[1]) : dir;
}

/**
 * Root folder to use in portable mode, or null when the app runs normally.
 * `exists` and `dir` are injectable so the decision can be tested without disk.
 * @param {string} execPath process.execPath
 * @param {{exists?:Function, dir?:string}} [opts]
 * @returns {string|null}
 */
function portableRoot(execPath, opts = {}) {
  const exists = opts.exists || fs.existsSync;
  const dir = opts.dir || appDir(execPath);
  return MARKERS.some((name) => exists(path.join(dir, name))) ? dir : null;
}

/**
 * <root>/data, created first: app.setPath('userData', <missing folder>) throws,
 * and the app would then die on its first line instead of writing a log.
 * @param {string} root folder returned by portableRoot()
 * @param {{mkdir?:Function}} [opts]
 * @returns {string}
 */
function portableDataDir(root, opts = {}) {
  const mkdir = opts.mkdir || ((dir) => fs.mkdirSync(dir, { recursive: true }));
  const data = path.join(root, 'data');
  try { mkdir(data); } catch { /* app.setPath will report the real problem */ }
  return data;
}

module.exports = { MARKERS, appDir, portableRoot, portableDataDir };
