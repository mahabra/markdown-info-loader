"use strict";

module.exports = () => function getHeadingPlugin(ast, info) {
  info.meta = info.meta || {};
  var headingKey = ast.children && ast.children.findIndex(function (item) {
    return item.type === `heading` && item.depth === 1;
  });

  if (headingKey >= 0) {
    info.meta.heading = ast.children[headingKey].children[0] &&
      ast.children[headingKey].children[0].value;
  } else {
    info.meta.heading = false;
  }
};