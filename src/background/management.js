const CONTAIN_URLS = {
  facebook: {
    // https://github.com/mozilla/contain-facebook/blob/master/src/background.js
    urls: [
      'facebook.com', 'www.facebook.com', 'facebook.net', 'fb.com',
      'fbcdn.net', 'fbcdn.com', 'fbsbx.com', 'tfbnw.net',
      'facebook-web-clients.appspot.com', 'fbcdn-profile-a.akamaihd.net', 'fbsbx.com.online-metrix.net', 'connect.facebook.net.edgekey.net',
      'instagram.com',
      'cdninstagram.com', 'instagramstatic-a.akamaihd.net', 'instagramstatic-a.akamaihd.net.edgesuite.net',
      'messenger.com', 'm.me', 'messengerdevelopers.com',
      'atdmt.com',
      'onavo.com',
      'oculus.com', 'oculusvr.com', 'oculusbrand.com', 'oculusforbusiness.com'
    ],
    REs: []
  },
  google: {
    // https://github.com/containers-everywhere/contain-google/blob/master/background.js
    urls: [
      'google.com', 'google.org', 'googleapis.com', 'g.co', 'ggpht.com',
      'blogger.com', 'googleblog.com', 'blog.google', 'googleusercontent.com', 'googlesource.com',
      'google.org', 'google.net', '466453.com', 'gooogle.com', 'gogle.com', 'ggoogle.com', 'gogole.com', 'goolge.com', 'googel.com', 'googlee.com', 'googil.com', 'googlr.com', 'elgoog.im', 'ai.google', 'com.google',
      'google.ac', 'google.ad', 'google.ae', 'google.com.af', 'google.com.ag', 'google.com.ai', 'google.al', 'google.am', 'google.co.ao', 'google.com.ar', 'google.as', 'google.at', 'google.com.au', 'google.az', 'google.ba', 'google.com.bd', 'google.be', 'google.bf', 'google.bg', 'google.com.bh', 'google.bi', 'google.bj', 'google.com.bn', 'google.com.bo', 'google.com.br', 'google.bs', 'google.bt', 'google.com.bw', 'google.by', 'google.com.bz', 'google.ca', 'google.com.kh', 'google.cc', 'google.cd', 'google.cf', 'google.cat', 'google.cg', 'google.ch', 'google.ci', 'google.co.ck', 'google.cl', 'google.cm', 'google.cn', 'google.com.co', 'google.co.cr', 'google.com.cu', 'google.cv', 'google.com.cy', 'google.cz', 'google.de', 'google.dj', 'google.dk', 'google.dm', 'google.com.do', 'google.dz', 'google.com.ec', 'google.ee', 'google.com.eg', 'google.es', 'google.com.et', 'google.fi', 'google.com.fj', 'google.fm', 'google.fr', 'google.ga', 'google.ge', 'google.gf', 'google.gg', 'google.com.gh', 'google.com.gi', 'google.gl', 'google.gm', 'google.gp', 'google.gr', 'google.com.gt', 'google.gy', 'google.com.hk', 'google.hn', 'google.hr', 'google.ht', 'google.hu', 'google.co.id', 'google.iq', 'google.ie', 'google.co.il', 'google.im', 'google.co.in', 'google.io', 'google.is', 'google.it', 'google.je', 'google.com.jm', 'google.jo', 'google.co.jp', 'google.co.ke', 'google.ki', 'google.kg', 'google.co.kr', 'google.com.kw', 'google.kz', 'google.la', 'google.lb', 'google.com.lc', 'google.li', 'google.lk', 'google.co.ls', 'google.lt', 'google.lu', 'google.lv', 'google.com.ly', 'google.co.ma', 'google.md', 'google.me', 'google.mg', 'google.mk', 'google.ml', 'google.com.mm', 'google.mn', 'google.ms', 'google.com.mt', 'google.mu', 'google.mv', 'google.mw', 'google.com.mx', 'google.com.my', 'google.co.mz', 'google.com.na', 'google.ne', 'google.com.nf', 'google.com.ng', 'google.com.ni', 'google.nl', 'google.no', 'google.com.np', 'google.nr', 'google.nu', 'google.co.nz', 'google.com.om', 'google.com.pk', 'google.com.pa', 'google.com.pe', 'google.com.ph', 'google.pl', 'google.com.pg', 'google.pn', 'google.com.pr', 'google.ps', 'google.pt', 'google.com.py', 'google.com.qa', 'google.ro', 'google.rs', 'google.ru', 'google.rw', 'google.com.sa', 'google.com.sb', 'google.sc', 'google.se', 'google.com.sg', 'google.sh', 'google.si', 'google.sk', 'google.com.sl', 'google.sn', 'google.sm', 'google.so', 'google.st', 'google.sr', 'google.com.sv', 'google.td', 'google.tg', 'google.co.th', 'google.com.tj', 'google.tk', 'google.tl', 'google.tm', 'google.to', 'google.tn', 'google.com.tr', 'google.tt', 'google.com.tw', 'google.co.tz', 'google.com.ua', 'google.co.ug', 'google.co.uk', 'google.us', 'google.com.uy', 'google.co.uz', 'google.com.vc', 'google.co.ve', 'google.vg', 'google.co.vi', 'google.com.vn', 'google.vu', 'google.ws', 'google.co.za', 'google.co.zm', 'google.co.zw',
      'like.com', 'keyhole.com', 'panoramio.com', 'picasa.com', 'urchin.com', 'igoogle.com', 'foofle.com', 'froogle.com', 'localguidesconnect.com', 'googlemail.com', 'googleanalytics.com', 'google-analytics.com', 'googletagmanager.com', 'googlecode.com', 'googlesource.com', 'googledrive.com', 'googlearth.com', 'googleearth.com', 'googlemaps.com', 'googlepagecreator.com', 'googlescholar.com', 'advertisercommunity.com', 'thinkwithgoogle.com',
      'youtube.com', 'youtu.be', 'yt.be', 'ytimg.com', ' youtube-nocookie.com', 'youtubegaming.com', 'youtubeeducation.com', 'youtube-nocookie.com',
      'blogspot.com', 'blogspot.ae', 'blogspot.al', 'blogspot.am', 'blogspot.com.ar', 'blogspot.co.at', 'blogspot.com.au', 'blogspot.ba', 'blogspot.be', 'blogspot.bg', 'blogspot.bj', 'blogspot.com.br', 'blogspot.com.by', 'blogspot.ca', 'blogspot.cf', 'blogspot.ch', 'blogspot.cl', 'blogspot.com.co', 'blogspot.cv', 'blogspot.com.cy', 'blogspot.cz', 'blogspot.de', 'blogspot.dj', 'blogspot.dk', 'blogspot.dm', 'blogspot.com.do', 'blogspot.dz', 'blogspot.com.eg', 'blogspot.es', 'blogspot.fi', 'blogspot.fr', 'blogspot.gr', 'blogspot.hr', 'blogspot.hu', 'blogspot.co.id', 'blogspot.ie', 'blogspot.co.il', 'blogspot.in', 'blogspot.is', 'blogspot.it', 'blogspot.jp', 'blogspot.co.ke', 'blogspot.kr', 'blogspot.li', 'blogspot.lt', 'blogspot.lu', 'blogspot.md', 'blogspot.mk', 'blogspot.com.mt', 'blogspot.mx', 'blogspot.my', 'blogspot.com.ng', 'blogspot.nl', 'blogspot.no', 'blogspot.co.nz', 'blogspot.pt', 'blogspot.qa', 'blogspot.ro', 'blogspot.rs', 'blogspot.ru', 'blogspot.se', 'blogspot.sg', 'blogspot.si', 'blogspot.sk', 'blogspot.sn', 'blogspot.com.sr', 'blogspot.td', 'blogspot.co.tl', 'blogspot.co.to', 'blogspot.com.tr', 'blogspot.tw', 'blogspot.co.uk', 'blogspot.com.uy', 'blogspot.co.za',
      'abc.xyz', 'waze.com', 'capitalg.com', 'gv.com', 'calicolabs.com', 'x.company', 'nest.com', 'sidewalklabs.com', 'verily.com',
      'doubleclickbygoogle.com', 'feedburner.com', 'doubleclick.com', 'doubleclick.net', 'adwords.com', 'adsense.com', 'admob.com', 'advertisercommunity.com',
      'googlesyndication.com', 'googlecommerce.com', 'googlebot.com', 'googleapps.com', 'googleadservices.com', 'gmodules.com', 'googl.com',
      '1e100.net', 'domains.google', 'gv.com',
      'madewithcode.com', 'design.google', 'gallery.io', 'domains.google', 'material.io', 'android.com', 'chromium.org', 'cobrasearch.com', 'chromecast.com', 'chrome.com', 'chromebook.com', 'madewithcode.com', 'whatbrowser.org', 'withgoogle.com', 'web.dev',
    ],
    REs: []
  },
  twitter: {
    // https://github.com/v1shwa/contain-twitter/blob/master/background.js
    urls: [
      'twitter.com', 'www.twitter.com', 't.co', 'twimg.com', 'mobile.twitter.com', 'm.twitter.com',
      'api.twitter.com', 'abs.twimg.com', 'ton.twimg.com', 'pbs.twimg.com', 'tweetdeck.twitter.com'
    ],
    REs: []
  },
  youtube: {
    // https://github.com/AbdullahDiaa/contain-youtube/blob/master/src/background.js
    urls: [
      'youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'
    ],
    REs: []
  },
  amazon: {
    // https://github.com/Jackymancs4/contain-amazon/blob/master/background.js
    urls: [
      'amazon.it', 'amazon.de', 'amazon.com', 'amazon.com.br', 'amazon.in', 'amazon.com.au', 'amazon.es', 'amazon.com.mx', 'amazon.co.jp', 'amazon.in', 'amazon.co.uk', 'amazon.ca', 'amazon.fr', 'amazon.com.sg',
      'awscloud.com', 'amazon.company', 'amazon.express', 'amazon.gd', 'amazon.international', 'amazon.ltda', 'amazon.press', 'amazon.shopping', 'amazon.tickets', 'amazon.tv', 'amazon.cruises', 'amazon.dog', 'amazon.express', 'amazon.game', 'amazon.gent', 'amazon.salon', 'amazon.shopping', 'amazon.tours', 'amazon.wiki', 'amazon.clothing', 'amazon.energy', 'amazon.fund', 'amazon.hockey', 'amazon.kiwi', 'amazon.re', 'amazon.soccer', 'amazon.tienda', 'amazon.training', 'amazon.jobs', 'primevideo.com', 'mturk.com', 'lab126.com', 'amazonpay.in', 'amazonteam.org', 'awsevents.com', 'seattlespheres.com',
    ],
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
      'block_outside_container@jspenguin.org': {
        name: 'Block sites outside container',
        enabled: false,
        version: false,
      },
      'treestyletab@piro.sakura.ne.jp': {
        name: 'Tree Style Tab',
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
      },
      '@contain-amazon': {
        name: 'Amazon Container',
        enabled: false,
        version: false,
        REs: CONTAIN_URLS.amazon.REs
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
      return;
    }
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
