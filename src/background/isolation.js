class Isolation {

  matchDomainPattern(url, domainPattern) {
    if (domainPattern.startsWith('/')) {
      const regexp = domainPattern.match(/\/(.*)\/(\w+)?/);
      console.log('regexp', regexp[1])
      return (new RegExp(regexp[1])).test(url);
    } else {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname === domainPattern ||
             globToRegexp(domainPattern).test(parsedUrl.hostname);
    }
  }
}

window.Isolation = Isolation;