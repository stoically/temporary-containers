module.exports = () => { return {
  mochaTest: true,
  runtime: {
    onInstalled: {
      addListener: sinon.stub()
    },
    onStartup: {
      addListener: sinon.stub()
    },
    onMessage: {
      addListener: sinon.stub()
    },
    onMessageExternal: {
      addListener: sinon.stub()
    },
    sendMessage: sinon.stub()
  },
  webRequest: {
    onBeforeRequest: {
      addListener: sinon.stub()
    },
    onCompleted: {
      addListener: sinon.stub()
    },
    onErrorOccurred: {
      addListener: sinon.stub()
    },
    onBeforeSendHeaders: {
      addListener: sinon.stub()
    }
  },
  windows: {
    onFocusChanged: {
      addListener: sinon.stub(),
    }
  },
  tabs: {
    onActivated: {
      addListener: sinon.stub()
    },
    onCreated: {
      addListener: sinon.stub()
    },
    onUpdated: {
      addListener: sinon.stub()
    },
    onRemoved: {
      addListener: sinon.stub()
    },
    create: sinon.stub(),
    remove: sinon.stub(),
    query: sinon.stub().resolves([{},{}]),
    get: sinon.stub()
  },
  storage: {
    local: {
      get: sinon.stub().resolves({}),
      set: sinon.stub()
    }
  },
  contextualIdentities: {
    create: sinon.stub(),
    get: sinon.stub().resolves({}),
    remove: sinon.stub()
  },
  browserAction: {
    onClicked: {
      addListener: sinon.stub()
    },
    setTitle: sinon.stub(),
    setBadgeBackgroundColor: sinon.stub(),
    setBadgeText: sinon.stub()
  },
  contextMenus: {
    create: sinon.stub(),
    removeAll: sinon.stub(),
    onClicked: {
      addListener: sinon.stub()
    }
  },
  commands: {
    onCommand: {
      addListener: sinon.stub()
    }
  },
  history: {
    deleteUrl: sinon.stub()
  },
  permissions: {
    contains: sinon.stub()
  },
  cookies: {
    onChanged: {
      addListener: sinon.stub()
    },
    set: sinon.stub(),
    get: sinon.stub()
  },
  pageAction: {
    setIcon: sinon.stub(),
    hide: sinon.stub(),
    show: sinon.stub()
  }
};};