module.exports = {
  title: 'Temporary Containers',
  description: 'Open tabs, websites, and links in automatically managed disposable containers',
  base: '/temporary-containers/',
  themeConfig: {
    repo: 'stoically/temporary-containers',
    docsDir: 'docs',
    editLinks: true,
    editLinkText: 'Help us improve this page!',
    sidebar: [
      ['/', 'Welcome'],
      '/guide',
      {
        title: 'Automatic Mode',
        collapsable: false,
        children: [
          '/automatic-mode/overview',
          '/automatic-mode/stay-logged-in',
        ]
      },
      {
        title: 'Isolation',
        collapsable: false,
        children: [
          '/isolation/global',
          '/isolation/per-domain',
          '/isolation/multi-account-containers',
          '/isolation/notes',
        ]
      },
      '/browser-fingerprinting',
      '/container-colors',
      '/debug-log',
      '/foxy-gestures',
      '/api',
      '/limitations',
    ]
  }
};