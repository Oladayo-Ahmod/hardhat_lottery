const { assert } = require('chai')
const { network,ethers,getNamedAccounts,deployments } = require('hardhat')
const {developmentChains, networkConfig} = require('../../helper-config')

!developmentChains.includes(network.name) 
? describe.skip 
: describe('Raffle unit test',async function(){
    let Raffle, VRFCoordinatorV2Mock
    const chainId = network.config.chainId

    beforeEach(async ()=>{
        const {deployer} = await getNamedAccounts()
       await deployments.fixture(["all"])
       Raffle = await ethers.getContract("Raffle",deployer)
       VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock",deployer)

    })

    describe("constructor",async ()=>{
        it("it initializes correctly", async ()=>{
            const raffleState = await Raffle.getRaffleState()
            const interval = await Raffle.getInterval()
            assert.equal(raffleState.toString(),'0')
            assert.equal(interval.toString(),networkConfig[chainId]['interval'])
        })
    })
    

    

})