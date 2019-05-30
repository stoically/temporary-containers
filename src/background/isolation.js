class Isolation {

  matchDomainPattern(url, domainPattern) {
    if (domainPattern.startsWith('/')) {
      const regexp = domainPattern.match(/^\/(.*)\/([gimsuy]+)?$/);
      try {
        return (new RegExp(regexp[1], regexp[2])).test(url);
      } catch(error) {
        return false;
      }
    } else {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname === domainPattern ||
             globToRegexp(domainPattern).test(parsedUrl.hostname);
    }
  }
}

window.Isolation = Isolation;