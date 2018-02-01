'use strict';

const format = require("winston").format;
const {LEVEL, MESSAGE} = require("triple-beam");
const META = Symbol.for("meta");
/*
 * function json (info)
 * Returns a new instance of the JSON format that turns a log `info`
 * object into pure JSON. This was previously exposed as { json: true }
 * to transports in `winston < 3.0.0`.
 */
module.exports = format(function (info, opts) {
  const meta = getMeta(info);
  if (meta) {
    info[META] = meta;
  }
  info[MESSAGE] = JSON.stringify(info, opts.replacer || replacer, opts.space);
  return info;
});

function getMeta(info) {
  const meta = {};
  let hasProperty = false;
  Object.keys(info).forEach((key) => {
    if (!["message", "level", LEVEL].includes(key)) {
      meta[key] = info[key];
      hasProperty = true;
    }
  });
  return hasProperty ? meta : null;
}

/*
 * function replacer (key, value)
 * Handles proper stringification of Buffer output.
 */
function replacer(key, value) {
  return value instanceof Buffer
    ? value.toString('base64')
    : value;
}
