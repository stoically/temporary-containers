# TC AMO

## Requirements

* Ubuntu 18.04
* Latest NodeJS and npm

## Building

* `npm install`
* `npm run build:parcel && npm run build:cp`

Build result is located in the `dist` directory.

## Third-party libraries

* Background
  * dist/background/lib.js
    * window.lib.delay: https://github.com/sindresorhus/delay/blob/v4.3.0/index.js
    * window.lib.PQueue: https://github.com/sindresorhus/p-queue/blob/v2.3.0/index.js
    * window.lib.psl: https://github.com/lupomontero/psl/blob/v1.4.0/dist/psl.min.js

* Preferences UI
  * jQuery
    * dist/vendor/jquery/jquery.min.js
    * https://github.com/jquery/jquery/blob/3.4.1/dist/jquery.min.js

  * jQuery-address
    * dist/vendor/jquery/jquery.address.js
    * https://github.com/escaleno-ltda/jquery-address/blob/fa31d3c7d7e265f1b376b72fd68b880c7ec156aa/src/jquery.address.js
      * No tags/releases on GitHub available

  * SemanticUI
    * dist/vendor/semantic/semantic.min.js
    * https://github.com/Semantic-Org/Semantic-UI/blob/deb275d2d5fe9a522a0b7bd8b6b6a1c939552718/dist/semantic.min.js
      * Pending issue about version 2.4.2 not being properly tagged/released on GitHub: https://github.com/Semantic-Org/Semantic-UI/issues/6646

  * SortableJS
    * dist/vendor/sortable/Sortable.min.js
    * https://github.com/SortableJS/Sortable/blob/1.10.1/Sortable.min.js

  * VueJS
    * dist/vendor/vue/vue.runtime.min.js
    * https://github.com/vuejs/vue/blob/v2.6.10/dist/vue.runtime.min.js

  * Vue.Draggable
    * dist/vendor/vue/vuedraggable.umd.min.js
    * https://github.com/SortableJS/Vue.Draggable/blob/v2.23.0/dist/vuedraggable.umd.min.js
