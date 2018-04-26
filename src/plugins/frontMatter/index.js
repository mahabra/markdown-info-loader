"use strict";

var yaml = require(`yaml-front-matter`);
var omit = require(`lodash.omit`);

module.exports = () => function frontMatterPlugin(
  ast,
  info,
  options,
  source
) {
  var yamlMeta = yaml.loadFront(source);

  info.meta = info.meta || {};

  /* Exclude markdown content from result, because content is optional */
  Object.assign(info.meta, omit(yamlMeta, [`__content`]));
};