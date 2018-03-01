// https://github.com/acvetkov/sinon-chrome/pull/75
// https://github.com/acvetkov/sinon-chrome/pull/73
const browser = require('sinon-chrome/webextensions');

module.exports = () => {
  browser.reset();
  browser.mochaTest = true;
  browser.contextMenus = browser.menus;
  browser.tabs.query.resolves([{},{}]);
  browser.storage.local.get.resolves({});
  browser.contextualIdentities.get.resolves({});
  return browser;
};