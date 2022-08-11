const { network, ethers } = require("hardhat")
const {developmentChains,networkConfig } = require('../helper-config')
const {verify} = require('../utils/verify')

module.exports = async function({getNamedAccounts,deployments}){
    const {deploy,log} = deployments
    const {deployer} = await getNamedAccounts()
    const chainId = network.config.chainId

    let VrfCoordinator2Address
    if (developmentChains.includes(network.name)) {
        const VrfCoordinatorV2Mocks = await ethers.getContract("VRFCoordinatorV2Mock")
        VrfCoordinator2Address = VrfCoordinatorV2Mocks.address
    }
    else{
        VrfCoordinator2Address  = networkConfig[chainId]["vrfCordinator2"]
    }

    const entranceFee = networkConfig[chainId]["entranceFee"]
    const subscriptionId = networkConfig[chainId]["subscriptionId"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callBackGasLimit = networkConfig[chainId]["callBackGasLimit"]
    const interval = networkConfig[chainId]["interval"]
    const args = [
        VrfCoordinator2Address,
        entranceFee,
        gasLane,
        subscriptionId,
        callBackGasLimit,
        interval]

    const raffle = await deploy("Raffle",{
        from : deployer,
        args : args,
        log : true,
        waitConfirmations : network.config.confirmations || 1
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY){
        log('--------------verifying--------------')
        await verify(raffle.address,args)
    }
    log('------------------------------')
    
}
module.exports.tags = ["all","Raffle"]