class Pref {
  constructor(background) {
    this.background = background;
  }
}

window.pref = background => new Proxy(new Pref(background), {
  get(target, key, receiver) {
    return Reflect.get(target.background.storage.local.preferences, key, receiver);
  },
});