"use strict";

var stringHash = require(`string-hash`);
var getResourceRelativeRequest = require(`./getResourceRelativeRequest`);

module.exports = () => function getResourceInfoPlugin(ast, info) {
  info.resource = {};
  /* Property ResourcePath is a full path to the target resource */
  info.resource.path = this.resourcePath;

  /* Property localPath is a path to the target resource relative to project root */
  info.resource.localPath = getResourceRelativeRequest(this);

  /* Property hashName is a unique name for this resource upon this project */
  info.resource.hashName = stringHash(info.resource.localPath);
};