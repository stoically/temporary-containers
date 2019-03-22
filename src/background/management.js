const CONTAIN_URLS = {
  facebook: {
    urls: ['facebook.com', 'www.facebook.com', 'fb.com', 'fbcdn.net', 'cdn.fbsbx.com', 'instagram.com', 'www.instagram.com', 'messenger.com', 'www.messenger.com', 'whatsapp.com', 'www.whatsapp.com', 'web.whatsapp.com', 'cdn.whatsapp.net', 'www-cdn.whatsapp.net', 'atdmt.com'],
    REs: []
  },
  google: {
    urls: ['google.com', 'google.ac', 'google.ad', 'google.ae', 'google.com.af', 'google.com.ag', 'google.com.ai', 'google.al', 'google.am', 'google.co.ao', 'google.com.ar', 'google.as', 'google.at', 'google.com.au', 'google.az', 'google.ba', 'google.com.bd', 'google.be', 'google.bf', 'google.bg', 'google.com.bh', 'google.bi', 'google.bj', 'google.com.bn', 'google.com.bo', 'google.com.br', 'google.bs', 'google.bt', 'google.com.bw', 'google.by', 'google.com.bz', 'google.ca', 'google.com.kh', 'google.cc', 'google.cd', 'google.cf', 'google.cat', 'google.cg', 'google.ch', 'google.ci', 'google.co.ck', 'google.cl', 'google.cm', 'google.cn', 'google.com.co', 'google.co.cr', 'google.com.cu', 'google.cv', 'google.com.cy', 'google.cz', 'google.de', 'google.dj', 'google.dk', 'google.dm', 'google.com.do', 'google.dz', 'google.com.ec', 'google.ee', 'google.com.eg', 'google.es', 'google.com.et', 'google.fi', 'google.com.fj', 'google.fm', 'google.fr', 'google.ga', 'google.ge', 'google.gf', 'google.gg', 'google.com.gh', 'google.com.gi', 'google.gl', 'google.gm', 'google.gp', 'google.gr', 'google.com.gt', 'google.gy', 'google.com.hk', 'google.hn', 'google.hr', 'google.ht', 'google.hu', 'google.co.id', 'google.iq', 'google.ie', 'google.co.il', 'google.im', 'google.co.in', 'google.io', 'google.is', 'google.it', 'google.je', 'google.com.jm', 'google.jo', 'google.co.jp', 'google.co.ke', 'google.ki', 'google.kg', 'google.co.kr', 'google.com.kw', 'google.kz', 'google.la', 'google.lb', 'google.com.lc', 'google.li', 'google.lk', 'google.co.ls', 'google.lt', 'google.lu', 'google.lv', 'google.com.ly', 'google.co.ma', 'google.md', 'google.me', 'google.mg', 'google.mk', 'google.ml', 'google.com.mm', 'google.mn', 'google.ms', 'google.com.mt', 'google.mu', 'google.mv', 'google.mw', 'google.com.mx', 'google.com.my', 'google.co.mz', 'google.com.na', 'google.ne', 'google.com.nf', 'google.com.ng', 'google.com.ni', 'google.nl', 'google.no', 'google.com.np', 'google.nr', 'google.nu', 'google.co.nz', 'google.com.om', 'google.com.pk', 'google.com.pa', 'google.com.pe', 'google.com.ph', 'google.pl', 'google.com.pg', 'google.pn', 'google.com.pr', 'google.ps', 'google.pt', 'google.com.py', 'google.com.qa', 'google.ro', 'google.rs', 'google.ru', 'google.rw', 'google.com.sa', 'google.com.sb', 'google.sc', 'google.se', 'google.com.sg', 'google.sh', 'google.si', 'google.sk', 'google.com.sl', 'google.sn', 'google.sm', 'google.so', 'google.st', 'google.sr', 'google.com.sv', 'google.td', 'google.tg', 'google.co.th', 'google.com.tj', 'google.tk', 'google.tl', 'google.tm', 'google.to', 'google.tn', 'google.com.tr', 'google.tt', 'google.com.tw', 'google.co.tz', 'google.com.ua', 'google.co.ug', 'google.co.uk', 'google.us', 'google.com.uy', 'google.co.uz', 'google.com.vc', 'google.co.ve', 'google.vg', 'google.co.vi', 'google.com.vn', 'google.vu', 'google.ws', 'google.co.za', 'google.co.zm', 'google.co.zw', 'youtube.com', 'blogger.com', 'doubleclickbygoogle.com', 'googleblog.com', 'blog.google', 'blogspot.com', 'blogspot.ae', 'blogspot.al', 'blogspot.am', 'blogspot.com.ar', 'blogspot.co.at', 'blogspot.com.au', 'blogspot.ba', 'blogspot.be', 'blogspot.bg', 'blogspot.bj', 'blogspot.com.br', 'blogspot.com.by', 'blogspot.ca', 'blogspot.cf', 'blogspot.ch', 'blogspot.cl', 'blogspot.com.co', 'blogspot.cv', 'blogspot.com.cy', 'blogspot.cz', 'blogspot.de', 'blogspot.dj', 'blogspot.dk', 'blogspot.dm', 'blogspot.com.do', 'blogspot.dz', 'blogspot.com.eg', 'blogspot.es', 'blogspot.fi', 'blogspot.fr', 'blogspot.gr', 'blogspot.hr', 'blogspot.hu', 'blogspot.co.id', 'blogspot.ie', 'blogspot.co.il', 'blogspot.in', 'blogspot.is', 'blogspot.it', 'blogspot.jp', 'blogspot.co.ke', 'blogspot.kr', 'blogspot.li', 'blogspot.lt', 'blogspot.lu', 'blogspot.md', 'blogspot.mk', 'blogspot.com.mt', 'blogspot.mx', 'blogspot.my', 'blogspot.com.ng', 'blogspot.nl', 'blogspot.no', 'blogspot.co.nz', 'blogspot.pt', 'blogspot.qa', 'blogspot.ro', 'blogspot.rs', 'blogspot.ru', 'blogspot.se', 'blogspot.sg', 'blogspot.si', 'blogspot.sk', 'blogspot.sn', 'blogspot.com.sr', 'blogspot.td', 'blogspot.co.tl', 'blogspot.co.to', 'blogspot.com.tr', 'blogspot.tw', 'blogspot.co.uk', 'blogspot.com.uy', 'blogspot.co.za'],
    REs: []
  },
  twitter: {
    urls: ['twitter.com', 'www.twitter.com', 't.co', 'twimg.com'],
    REs: []
  },
  youtube: {
    urls: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'],
    REs: []
  }
};

for (const containWhat of Object.keys(CONTAIN_URLS)) {
  for (const url of CONTAIN_URLS[containWhat].urls) {
    CONTAIN_URLS[containWhat].REs.push(new RegExp(`^(.*\\.)?${url}$`));
  }
}

class Management {

  constructor() {
    this.addons = {
      '@testpilot-containers': {
        name: 'Firefox Multi-Account Containers',
        enabled: false,
        version: false
      },
      'containerise@kinte.sh': {
        name: 'Containerise',
        enabled: false,
        version: false
      },
      '@contain-facebook': {
        name: 'Facebook Container',
        enabled: false,
        version: false,
        REs: CONTAIN_URLS.facebook.REs
      },
      '@contain-google': {
        name: 'Google Container',
        enabled: false,
        version: false,
        REs: CONTAIN_URLS.google.REs
      },
      '@contain-twitter': {
        name: 'Twitter Container',
        enabled: false,
        version: false,
        REs: CONTAIN_URLS.twitter.REs
      },
      '@contain-youtube': {
        name: 'YouTube Container',
        enabled: false,
        version: false,
        REs: CONTAIN_URLS.youtube.REs
      }
    };
  }


  async initialize() {
    try {
      const extensions = await browser.management.getAll();
      extensions.map(extension => {
        if (!this.addons[extension.id]) {
          return;
        }
        this.addons[extension.id].enabled = extension.enabled;
        this.addons[extension.id].version = extension.version;
      });
    } catch (error) {
      debug('[management:initialize] couldnt getAll extensions', error);
    }

    browser.management.onDisabled.addListener(this.disable.bind(this));
    browser.management.onUninstalled.addListener(this.disable.bind(this));
    browser.management.onEnabled.addListener(this.enable.bind(this));
    browser.management.onInstalled.addListener(this.enable.bind(this));
  }


  disable(extension) {
    if (!this.addons[extension.id]) {
      return;
    }
    this.addons[extension.id].enabled = false;
    this.addons[extension.id].version = extension.version;
  }


  enable(extension) {
    if (!this.addons[extension.id]) {
      return;
    }
    this.addons[extension.id].enabled = true;
    this.addons[extension.id].version = extension.version;
  }
}

window.Management = Management;
