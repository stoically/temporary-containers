/* eslint-disable */
// simplified version of https://github.com/fitzgen/glob-to-regexp
const globToRegexp = (glob) => {
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


// https://github.com/substack/semver-compare/pull/4
const versionCompare = function cmp (a, b) {
    var pa = a.split('.');
    var pb = b.split('.');
    for (var i = 0; i < Math.min(pa.length, pb.length); i++) {
        var na = Number(pa[i]);
        var nb = Number(pb[i]);
        if (na > nb) return 1;
        if (nb > na) return -1;
        if (!isNaN(na) && isNaN(nb)) return 1;
        if (isNaN(na) && !isNaN(nb)) return -1;
    }
    return 0;
};


module.exports = {
  globToRegexp,
  versionCompare
}
