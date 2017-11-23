const linksClicked = {};
const tabClickState = {};
const tabContainerMap = {};
let tempContainerCounter = 0;

let DEBUG = false;
const debug = function() {
  if (!DEBUG) {
    return;
  }
  console.log(...arguments);
}

browser.runtime.onInstalled.addListener((details) => {
  if (details.temporary) {
    DEBUG = true;
  }
});


browser.runtime.onStartup.addListener(async () => {
  try {
    const tabs = await browser.tabs.query();
    debug(tabs);
  } catch (error) {
    debug('error while retrieving tabs on startup', error);
  }
});


const reloadTabInTempContainer = async (tab, url) => {
  tempContainerCounter++;
  containerName = `TempContainer${tempContainerCounter}`;
  try {
    const contextualIdentity = await browser.contextualIdentities.create({
      name: containerName,
      color: 'red',
      icon: 'circle'
    })
    debug('contextualIdentity created', contextualIdentity);

    try {
      const active = url ? false : true;
      const newTab = await browser.tabs.create({
        url,
        active,
        cookieStoreId: contextualIdentity.cookieStoreId
      });
      debug('new tab in temp container created', newTab);
      tabContainerMap[newTab.id] = contextualIdentity.cookieStoreId;

      try {
        browser.tabs.remove(tab.id);
        debug('removed old tab', tab.id);
      } catch (error) {
        debug('error while removing old tab', tab, error);
      }
    } catch (error) {
      debug('error while creating new tab', error);
    }
  } catch (error) {
    debug('error while creating container', containerName, error);
  }
}


browser.tabs.onCreated.addListener(async function(tab) {
  if (tab.openerTabId) {
    // TODO: consider checking whether the opener is an about: or moz-extension: page
    //       and if thats the case, track the tab and if it updates to an http(s) url, open in temp
    debug('tab has an openerTabId, we handle that in onBeforeRequest', tab);
    return;
  }

  if (tab.cookieStoreId !== 'firefox-default') {
    debug('tab already belongs to a container, we dont handle that', tab);
    return;
  }

  if (tab.url !== 'about:newtab') {
    debug('tab url is not about:newtab, we dont handle that', tab);
    return;
  }

  debug('fresh firefox-default tab, open in temp container', tab);
  await reloadTabInTempContainer(tab);
});


browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if ((changeInfo.url !== 'about:home' && changeInfo.url !== 'about:newtab')
      || tab.cookieStoreId !== 'firefox-default') {
    debug('tab updated but changed url isnt about:home and/or cookieStoreId isnt firefox-default', changeInfo);
    return;
  }
  debug('tab updated to about:home or about:newtab and we are in the default store, open in temp container', tab);
  await reloadTabInTempContainer(tab);
})


browser.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  if (!tabContainerMap[tabId]) {
    debug('tabid is not in the tabContainerMap, not relevant', tabId);
    return;
  }
  const cookieStoreId = tabContainerMap[tabId];
  delete tabContainerMap[tabId];

  const tempTabs = await browser.tabs.query({
    cookieStoreId
  });
  if (tempTabs.length > 1) {
    debug('there are still more than one tab in that temp container open', tempTabs, cookieStoreId);
    return;
  }

  setTimeout(async () => {
    debug('no tabs in temp container anymore, deleting container', cookieStoreId);
    try {
      const contextualIdentity = await browser.contextualIdentities.remove(cookieStoreId)
      if (!contextualIdentity) {
        debug('couldnt find container to remove', cookieStoreId)
      } else {
        debug('removed container', contextualIdentity);
      }
    } catch (error) {
      debug('error while removing container', cookieStoreId, error);
    }
  }, 100);
});


browser.webRequest.onBeforeRequest.addListener(async (request) => {
  if (request.tabId === -1) {
    // shouldn't ever be the case because of main_frame
    debug('web request has no tabId, not relevant', request);
    return;
  }
  debug('web request tab id', request.tabId);
  debug('web request url', request.url);
  if (!linksClicked[request.url]) {
    debug('web request url not in linksClicked, not relevant', request.url);
    return;
  }
  linksClicked[request.url]--;
  if (!linksClicked[request.url]) {
    delete linksClicked[request.url];
  }
  debug('linksClicked', JSON.stringify(linksClicked));

  const tab = await browser.tabs.get(request.tabId);
  debug('requested tab information', tab);
  if (!tab) {
    debug('we have no information for that tab. ff broken?!', request.tabId);
    return;
  }
  if (!tabClickState[tab.openerTabId]) {
    debug('we have no relevant click state for this tab, openerTabId', tab.openerTabId);
    return;
  }
  if (!tabClickState[tab.openerTabId][request.url]) {
    debug('we have no matching url in the click state', request.url);
    return;
  }
  debug('url matched! we should open in container', request.url);

  tabClickState[tab.openerTabId][request.url]--;
  if (!tabClickState[tab.openerTabId][request.url]) {
    delete tabClickState[tab.openerTabId][request.url];
  }
  if (!Object.keys(tabClickState[tab.openerTabId]).length) {
    delete tabClickState[tab.openerTabId];
  }
  debug('tabClickState', JSON.stringify(tabClickState));

  await reloadTabInTempContainer(tab, request.url);

  return {
    cancel: true
  }
},{
    urls: ['<all_urls>'],
    types: ['main_frame']
  },
  ['blocking']
);


browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (typeof message !== 'object' || !message.linkClicked) {
    return;
  }

  if (!linksClicked[message.linkClicked.href]) {
    linksClicked[message.linkClicked.href] = 0;
  }
  linksClicked[message.linkClicked.href]++;
  debug('linksClicked', JSON.stringify(linksClicked));

  if (!tabClickState[sender.tab.id]) {
    tabClickState[sender.tab.id] = {};
  }
  if (!tabClickState[sender.tab.id][message.linkClicked.href]) {
    tabClickState[sender.tab.id][message.linkClicked.href] = 0;
  }
  tabClickState[sender.tab.id][message.linkClicked.href]++;
  debug('tabClickState', JSON.stringify(tabClickState));
});
