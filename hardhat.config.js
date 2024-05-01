require('@nomicfoundation/hardhat-toolbox');
require("dotenv").config();
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.9',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    hardhat: {
      chainId: 31337,
      mining: {
        // auto: false,
        // interval: 1000,
        // mempool: {
        //   order: "fifo"
        // }
      },
    },
    goerli: {
      url: 'https://eth-goerli.g.alchemy.com/v2/PTFrOSaNvkEHwG6QwYlaAs8zKETpjG1m',
      accounts: [
        // '8b2e8a10dbb0a8a16b7a2d5e7de6b67fc5f8f81362c65442ecf68a0dd72c0919',
        process.env.PRIVATE_KEY
      ],
    },
    sepolia: {
      url: 'https://eth-sepolia.g.alchemy.com/v2/91JTokNoULLEKwDuyJLGqeIrm9h-1A01',
      accounts: [
        // '8b2e8a10dbb0a8a16b7a2d5e7de6b67fc5f8f81362c65442ecf68a0dd72c0919',
        process.env.PRIVATE_KEY
      ],
    },
    polygon: {
      url: 'https://rpc.ankr.com/polygon',
      accounts: [
        // '8b2e8a10dbb0a8a16b7a2d5e7de6b67fc5f8f81362c65442ecf68a0dd72c0919',
        process.env.PRIVATE_KEY
      ],
    },
    mumbai: {
      // url: 'https://rpc.ankr.com/polygon_mumbai',
      url: 'https://rpc.ankr.com/polygon_mumbai/bf22a1af586c8f23c56205136ecbee0965c7d06d57c29d414bcd8ad877a0afc4',
      accounts: [
        // '8b2e8a10dbb0a8a16b7a2d5e7de6b67fc5f8f81362c65442ecf68a0dd72c0919',
        process.env.PRIVATE_KEY
      ],
    },
  },
  gasReporter: {
    enabled: true,
    currency: 'ETH',
  },
  etherscan: {
    // apiKey: 'E4A9E594QRAUPNC3VAITZIMIPU6UUD79NQ', //etherscan
    apiKey: 'V3Q48E5BSX3MBDFPY3HWYK3VFP2BH9BIAN', //etherscan
  },
};
