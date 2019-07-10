import App from './popup.vue';

import('./root').then(root => {
  root.default(App, {popup: true});
});