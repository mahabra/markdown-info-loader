"use strict";

/* Get resource relative to project root path
To get this I uses context path. By excluding context path length I get
needed relative path. But, another way is getting
'_module.NormalModule.rawRequest;', but property `_module` but it looks like
internal property, which can be unstable across versions.
*/

module.exports = function getResourceRelativeRequest(lc) {
  return lc.resourcePath.substring(lc.options.context.length);
  // Or maybe This._module.NormalModule.rawRequest;
};