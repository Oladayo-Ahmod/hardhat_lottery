const {developmentChains,networkConfig } = require('../hardhat.config')

module.exports  = async function({deployments,getNamedAccounts}){
    const {log,deploy} = deployments
    const {deployer} = await getNamedAccounts();
    const chainId = network.config.chainId

    if (developmentChains.includes(network.name)) {
        log('local network detected')
    }

}