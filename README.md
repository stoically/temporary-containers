# Temporary Containers Firefox Add-on [![Build Status](https://travis-ci.org/stoically/temporary-containers.svg?branch=master)](https://travis-ci.org/stoically/temporary-containers)

Detailed information about the Add-on [can be found on AMO](https://addons.mozilla.org/firefox/addon/temporary-containers/). There's also [this long-form article](https://medium.com/@stoically/enhance-your-privacy-in-firefox-with-temporary-containers-33925cd6cd21) and the [project wiki](https://github.com/stoically/temporary-containers/wiki).

## Development

### Requirements

- Clone the repository
- `npm install`
- `npm run watch`

### Run in Firefox

- `npm install -g web-ext`
- `web-ext run -s dist`
  - starts the default system Firefox, loads the Add-on and watches for changes
  - append `-p profilename` to start Firefox with a different profile

or

- Open `about:debugging` and `Load Temporary Add-on` which is located in the `dist` directory

Check `about:debugging` and click `Debug` under Temporary Container to see the console.

### Run the tests

- Once: `npm test`
  - Shows a coverage summary and generates a detailed report in the `coverage` directory
- Watcher: `npm run test:watch`
  - Set `security.csp.enable` to `false` in `about:config` if you want working parcel hmr for UI dev and change back to `true` when you're done

### Release

#### AMO and GitHub

- Bump manifest version
- Commit, tag and push
- Upload zip web-ext-artifact to AMO
- Download published AMO xpi
- Create and publish GitHub release with AMO xpi

#### Pre-Release on GitHub

- Bump manifest version
- Commit and push
- git tag v1.0beta1
- git push origin v1.0beta1
- git log \$(git tag --sort=-version:refname | sed -n 2p)..HEAD --pretty=format:%s
- Add release notes and publish

## Libraries

[Vue.js](https://vuejs.org) and [SemanticUI](https://semantic-ui.com/) are used for the preferences & popup UI.

## License

MIT
