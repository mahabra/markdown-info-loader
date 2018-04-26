"use strict";

/* eslint no-underscore-dangle: 0 */
var unified = require(`unified`);
var parse = require(`remark-parse`);
var loaderUtils = require(`loader-utils`);

var defaultOptions = require(`./defaultOptions`);
var resolvePlugin = require(`./resolvePlugin`);

/* Import build-in plugins */
var getResourceInfoPlugin = require(`./plugins/getResourceInfo`);
var importSourcePlugin = require(`./plugins/importSource`);
var getHeadingPlugin = require(`./plugins/getHeading`);
var frontMatterPlugin = require(`./plugins/frontMatter`);
var gitCommitsPlugin = require(`./plugins/gitCommits`);

module.exports = function loader(source) {
  this.cacheable && this.cacheable();
  var output = [`module.exports = {}`];
  var info = {};
  var userOptions = loaderUtils.getOptions(this);
  var options = Object.assign(defaultOptions, userOptions);

  /* Is user append any plugins */
  var pluginsDefined = options.plugins && options.plugins instanceof Array;

  /* Define plugins */
  let plugins = [];

  /* Get markdown AST (powered by unified and remark-parse) */
  var parser = unified().use(parse, Object.assign({
    commonmark: options.parse.commonmark
  }, options));
  var ast = parser.parse(source);

  /* Get resource information */
  if (options.resource) {
    plugins.push([getResourceInfoPlugin, options.resource]);
  }

  /* Use git CLI to get file advanced info */
  if (options.git) {
    plugins.push([gitCommitsPlugin, options.git]);
  }

  /* Parse front matter data */
  if (options.parse.frontMatter) {
    plugins.push([frontMatterPlugin, options.parse.frontMatter]);
  }

  /* Walk ast for heading */
  if (options.parse.heading) {
    plugins.push([getHeadingPlugin, options.parse.heading]);
  }

  /* Import source */
  if (options.importSource) {
    plugins.push([importSourcePlugin, options.importSource]);
  }

  /* Append user plugins */
  if (pluginsDefined) {
    plugins = plugins.concat(options.plugins);
  }

  /* Execute plugins */
  plugins
    .map(resolvePlugin)
    .map((plugin) => Reflect.apply(
      plugin.use(plugin.options),
      this,
      [ast, info, options, source, output]
    ))
    .filter(Boolean)
    .forEach((code) => output.push(code));

  output.push(`module.exports = Object.assign(
    module.exports,
    ${JSON.stringify(info)},
  )`);

  // Done
  return output.join(`\n`);
};