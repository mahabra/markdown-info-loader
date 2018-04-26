"use strict";

var stringifyLoaders = require(`webpack-stringify-loaders`);
var queryString = require(`query-string`);

/* Supports only loaders with serializable options */
function querifyLoaders(loaders) {
  if (typeof loaders === `string`) {
    return loaders;
  } else if (typeof loaders === `object`) {
    if (loaders instanceof Array) {
      return loaders.map(querifyLoaders);
    }
    if (typeof loaders.options === `object`) {
      return Object.assign({}, loaders, {
        query: queryString.stringify(loaders.options)
      });
    }
  }
  return loaders;
}

module.exports = function importSourcePlugin(config) {
  if (!(config instanceof Array)) {
    config = [`raw-loader`];
  }
  const random = Math.random();
  return function importSource(
    ast,
    info,
    options,
    source,
    output
  ) {
    /* Import source can be as a single loader, i.q. array of loaders.
     * withal loader can ba a string, ot an object */
    var inlineLoader = stringifyLoaders(querifyLoaders(config));
    output.push(`
/* Rnadom ${Math.random(random)}*/
const _source = require('!${inlineLoader}!${this.resourcePath}');`);

    return `
  Object.assign(
    module.exports,
    {
      source: _source
    }
  )
  `;
  };
};