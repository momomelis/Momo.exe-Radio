require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },

  networks: {
    hardhat: {},
    sepolia: {
      url: process.env.RPC_URL_SEPOLIA || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
    mainnet: {
      url: process.env.RPC_URL_MAINNET || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },

  // Contract address — populated by deploy script, read by subsequent scripts
  momoAddress: process.env.CONTRACT_ADDRESS || "",
};
