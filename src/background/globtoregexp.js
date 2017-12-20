/* eslint-disable */
// simplified version of https://github.com/fitzgen/glob-to-regexp
module.exports = (glob) => {
  if (typeof glob !== 'string') {
    throw new TypeError('Expected a string');
  }

  var str = String(glob);

  // The regexp we are building, as a string.
  var reStr = "";

  // RegExp flags (eg "i" ) to pass in to RegExp constructor.
  var flags = "i";

  var c;
  for (var i = 0, len = str.length; i < len; i++) {
    c = str[i];

    switch (c) {
    case "\\":
    case "/":
    case "$":
    case "^":
    case "+":
    case ".":
    case "(":
    case ")":
    case "=":
    case "!":
    case "|":
    case ",":
      reStr += "\\" + c;
      break;

    case "*":
      reStr += ".*";
      break;

    default:
      reStr += c;
    }
  }

  return new RegExp(reStr, flags);
};
