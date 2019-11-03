class Utils {
  sameDomain(origin, target) {
    return psl.parse(origin).domain === psl.parse(target).domain;
  }

  addMissingKeys({ defaults, source }) {
    let addedMissing = false;
    const addKeys = (_default, _source) => {
      Object.keys(_default).map(key => {
        if (_source[key] === undefined) {
          debug(
            '[addMissingKeys] key not found, setting default',
            key,
            _default[key]
          );
          _source[key] = _default[key];
          addedMissing = true;
        } else if (Array.isArray(_source[key])) {
          return;
        } else if (typeof _source[key] === 'object') {
          addKeys(_default[key], _source[key]);
        }
      });
    };
    addKeys(defaults, source);

    return addedMissing;
  }

  clone(input) {
    return JSON.parse(JSON.stringify(input));
  }
}

window.Utils = Utils;
