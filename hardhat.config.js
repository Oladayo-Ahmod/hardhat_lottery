require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("hardhat-gas-reporter")
require("solidity-coverage")
require("hardhat-contract-sizer")
require("dotenv").config()

const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL || 'https://someething'
const PRIVATE_KEY = process.env.PRIVATE_KEY || '26479d2816d2979b0e14c3e05744df448e4d10946737d60f82181d2526efa8b8'
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const REPORT_GAS = process.env.REPORT_GAS || false

module.exports = {
    defaultNetwork : "hardhat",
    networks : {
        hardhat : {
            chainId : 31337,
            blockConfirmations : 1
        },
        rinkeby : {
            chainId : 4,
            blockConfirmations : 6,
            url : RINKEBY_RPC_URL,
            accounts : [PRIVATE_KEY]

        }
    },
    etherscan: {
        // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
        apiKey: {
            rinkeby: ETHERSCAN_API_KEY,
            // kovan: ETHERSCAN_API_KEY,
            // polygon: POLYGONSCAN_API_KEY,
        },
    },
    gasReporter: {
        enabled: REPORT_GAS,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        coinmarketcap: COINMARKETCAP_API_KEY,
    },
    solidity: {
        compilers: [
            {
                version: "0.8.9",
            },
            {
                version: "0.4.24",
            },
        ],
    },
    namedAccounts : {
        deployer : {
            default : 0
        },
        player : {
            default : 1
        }
    },
    mocha: {
        timeout: 500000, // 500 seconds max for running tests
    },
};
