require('@nomicfoundation/hardhat-toolbox')

require('dotenv').config()
require('./tasks')
require('hardhat-deploy')

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: '0.8.28',
    defaultNetwork: 'hardhat',
    networks: {
        localhost: {
            url: 'http://127.0.0.1:8545',
            chainId: 31337,
        },
        sepolia: {
            url: process.env.SEPOLIA_RPC_URL,
            accounts: [process.env.PRIVATE_KEY_1, process.env.PRIVATE_KEY_2],
            chainId: 11155111,
            gasPrice: 100e9, // 100 gwei 下限；实际发交易时用 getGasOverrides 动态加价 30%，避免 REPLACEMENT_UNDERPRICED
        },
    },
    sourcify: {
        enabled: true,
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
    namedAccounts: {
        // 默认情况下，hardhat会使用第一个账户作为部署者
        firstAccount: {
            default: 0,
        },
        secondAccount: {
            default: 1,
        },
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS === 'true',
        currency: 'USD',
        gasPrice: 100,
    },
}

// npx hardhat verify --network mainnet DEPLOYED_CONTRACT_ADDRESS "10"

// npx hardhat verify --network sepolia 0x8B0F034742C83D73164dfB7b7DfaFE8a38C3A470  "300"
