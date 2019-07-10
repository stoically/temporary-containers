import App from './options.vue';

import('./root').then(root => {
  root.default(App, {});
});