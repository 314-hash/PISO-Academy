// @ts-check
/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'PISO Academy Developer Documentation',
  tagline: 'Learn. Code. Build. Deploy. Built by Filipinos for Builders.',
  favicon: 'img/favicon.ico',

  url: 'https://academy.piso-chain.org',
  baseUrl: '/',

  organizationName: '314-hash',
  projectName: 'piso-academy',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fil'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/314-hash/piso-academy/tree/main/academy-docs/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'PISO Academy Docs',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Documentation',
          },
          {
            href: 'https://piso-blockchain.vercel.app/explorer',
            label: 'PISO Explorer',
            position: 'right',
          },
          {
            href: 'https://github.com/314-hash/piso-academy',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              { label: 'Blockchain Basics', to: '/docs/blockchain-basics/architecture' },
              { label: 'PISO Chain RPC', to: '/docs/piso-chain/rpc-specification' },
              { label: 'Tutorials', to: '/docs/tutorials/build-first-piso-dapp' },
            ],
          },
          {
            title: 'Ecosystem',
            items: [
              { label: 'PISO Explorer', href: 'https://piso-blockchain.vercel.app/explorer' },
              { label: 'Faucet & Dashboard', href: 'https://piso-blockchain.vercel.app/' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} PISO Academy Contributors. Built for Filipino Builders.`,
      },
    }),
};

export default config;
