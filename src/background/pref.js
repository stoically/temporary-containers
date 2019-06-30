class Pref {
  constructor(background) {
    this.preferences = background.storage.local.preferences;
  }
}

window.pref = background => new Proxy(new Pref(background), {
  get(target, key, receiver) {
    const value = Reflect.get(target, key, receiver);
    if (typeof value === 'function') {
      return function () {
        return value.apply(this, arguments);
      };
    } else {
      return Reflect.get(target.preferences, key, receiver);
    }
  },
});