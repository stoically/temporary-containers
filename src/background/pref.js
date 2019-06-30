class Pref {
  constructor(background) {
    this.preferences = background.storage.local.preferences;
  }
}

window.pref = background => new Proxy(new Pref(background), {
  get(target, key, receiver) {
    return Reflect.get(target.preferences, key, receiver);
  },
});