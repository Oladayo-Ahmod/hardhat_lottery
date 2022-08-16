const { ethers } = require("hardhat")
const fs = require('fs')
const FRONT_END_ABI_FILE = '../nextjs-hardhat-lottery/constants/contractAddress.json'
const FRONT_END_ADDRESS_FILE = '../nextjs-hardhat-lottery/constants/abi.json'

module.exports = function(){
    if(process.env.UPDATE_FRON_END){
        console.log('updating front-end')
        updateContractAddress()
        updateAbi()
    }
}
async function updateContractAddress(){
    const contract = await ethers.getContract('Raffle')
    const chainId = network.config.chainId.toString()
    const currentAddress = JSON.parse(fs.readFileSync(FRONT_END_ADDRESS_FILE,'utf8'))    
    // const currentAbi = JSON.parse(fs.readFileSync(FRONT_END_ABI_FILE,'utf8'))

    if (chainId in currentAddress) { // check for chain id
        if (!currentAddress[chainId].includes(contract.address)) { // check if contract address exist
            currentAddress[chainId].push(contract.address)
        }
    }
    else{
        currentAddress[chainId] = [contract.address] // update contract address if 
    }
    fs.writeFileSync(FRONT_END_ADDRESS_FILE,JSON.stringify(currentAddress)) // write updated address back to the file
}

async function updateAbi(){
    const contract = await ethers.getContract('Raffle')
    fs.writeFileSync(FRONT_END_ABI_FILE,contract.interface.format(ethers.utils.FormatTypes.json))
}

module.exports.tags = ["all","frontend"]