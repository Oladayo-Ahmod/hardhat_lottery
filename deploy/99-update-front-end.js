const { ethers } = require("ethers")
const fs = require('fs')
const FRONT_END_ABI_FILE = '../../nextjs-hardhat-lottery/constants/contractAddress.json'
const FRONT_END_ADDRESS_FILE = '../../nextjs-hardhat-lottery/constants/abi.json'

module.exports = function(){
    if(process.env.UPDATE-FRON_END){
        console.log('updating front-end')
        updateFrontend()
    }
}
async function updateFrontend(){
    const contract = await ethers.getContract('Raffle')
    const currentAddress = json.parse(fs.readFileSync(FRONT_END_ADDRESS_FILE))
}