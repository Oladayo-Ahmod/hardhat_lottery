const { network, ethers } = require("hardhat")
const {developmentChains,networkConfig } = require('../hardhat.config')

module.exports = async function({getNamedAccounts,deployments}){
    const {deploy,log} = deployments
    const deployer = await getNamedAccounts()
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
    
    const args = [VrfCoordinator2Address,entranceFee]
    const raffle = await deploy("Raffle",{
        from : deployer,
        args : args,
        log : true,
        waitConfirmations : network.config.confirmations || 1

    })
}