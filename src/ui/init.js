export default function init(App, params = {}) {
  // Workaround until parcel supports externals
  // https://github.com/parcel-bundler/parcel/issues/144

  const loadStylesheet = (href) => {
    return new Promise((resolve, reject) => {
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.type = 'text/css';
      stylesheet.href = href;
      stylesheet.onload = resolve;
      stylesheet.onerror = reject;
      document.head.appendChild(stylesheet);
    });
  };

  const loadScript = (href) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.async = false;
      script.src = href;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  Promise.all([
    loadStylesheet('/fontello/fontello-embedded.css'),
    loadStylesheet('/semantic/semantic.min.css'),
    loadScript('/jquery/jquery.min.js'),
    loadScript('/jquery/jquery.address.js'),
    loadScript('/semantic/semantic.min.js'),
    loadScript('/vue/vue.runtime.min.js'),
    import('./root')
  ]).then(promises => {
    const root = promises.pop().default;
    root(App, params);
  })
    .catch(console.error);
}