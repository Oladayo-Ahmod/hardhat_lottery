const { ethers } = require('hardhat');
const {developmentChains,networkConfig } = require('../hardhat.config')
const {verify} = require('../utils/verify')

module.exports  = async function({deployments,getNamedAccounts}){
    const {log,deploy} = deployments
    const {deployer} = await getNamedAccounts();
    const chainId = network.config.chainId

    const BASE_FEE = ethers.utils.parseEther("0.25") //base fee
    const GAS_PRICE_LINK = 1e9 //link per gas
    const args = [BASE_FEE,GAS_PRICE_LINK]
    if (chainId == 31337) {
        log('local network detected')
        await deploy("VRFCoordinatorV2Mock",{
            from : deployer,
            args : args,
            log : true
        })
        log('Mocks deployed')
        log('-----------------------------------')
    }

}
module.exports.tags = ["all","mocks"]