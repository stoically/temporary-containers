class Isolation {

  matchDomainPattern(url, domainPattern) {
    if (domainPattern.startsWith('/')) {
      const regexp = domainPattern.match(/^\/(.*)\/([gimsuy]+)?$/);
      return (new RegExp(regexp[1], regexp[2])).test(url);
    } else {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname === domainPattern ||
             globToRegexp(domainPattern).test(parsedUrl.hostname);
    }
  }
}

window.Isolation = Isolation;