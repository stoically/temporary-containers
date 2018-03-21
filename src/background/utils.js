class Utils {
  sameDomain(origin, target) {
    return psl.parse(origin).domain === psl.parse(target).domain;
  }
}

window.Utils = Utils;