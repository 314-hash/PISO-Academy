/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: '1. Blockchain Basics',
      items: ['blockchain-basics/architecture'],
    },
    {
      type: 'category',
      label: '2. Solidity & EVM',
      items: ['solidity/best-practices'],
    },
    {
      type: 'category',
      label: '3. PISO Chain Integration',
      items: [
        'piso-chain/rpc-specification',
        'piso-chain/precompiles',
      ],
    },
    {
      type: 'category',
      label: '4. Tutorials & Cookbooks',
      items: ['tutorials/build-first-piso-dapp'],
    },
    {
      type: 'category',
      label: '5. Smart Contract Security',
      items: ['security/threat-modeling'],
    },
  ],
};

export default sidebars;
