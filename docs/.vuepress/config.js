module.exports = {
  title: 'Temporary Containers',
  description: 'Open tabs, websites, and links in automatically managed disposable containers',
  base: '/temporary-containers/',
  themeConfig: {
    // Assumes GitHub. Can also be a full GitLab url.
    repo: 'stoically/temporary-containers',
    // Customising the header label
    // Defaults to "GitHub"/"GitLab"/"Bitbucket" depending on `themeConfig.repo`
    // repoLabel: 'Contribute!',

    // Optional options for generating "Edit this page" link

    // if your docs are in a different repo from your main project:
    // docsRepo: 'vuejs/vuepress',
    // if your docs are not at the root of the repo:
    docsDir: 'docs',
    // if your docs are in a specific branch (defaults to 'master'):
    // docsBranch: 'master',
    // defaults to false, set to true to enable
    editLinks: true,
    // custom text for edit link. Defaults to "Edit this page"
    editLinkText: 'Help us improve this page!',
    sidebar: [
      ['/', 'Welcome'],
      '/automatic-mode',
      {
        title: 'Isolation',
        collapsable: false,
        children: [
          '/isolation/global',
          '/isolation/per-domain',
          '/isolation/multi-account-containers',
          '/isolation/notes'
        ]
      },
      '/api',
      '/browser-fingerprinting',
      '/container-colors',
      '/debug-log',
      '/foxy-gestures'
    ]
  }
}