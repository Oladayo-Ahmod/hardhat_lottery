const { assert, expect } = require('chai')
const { network,ethers,getNamedAccounts,deployments } = require('hardhat')
const { it } = require('mocha')
const {developmentChains, networkConfig} = require('../../helper-config')

!developmentChains.includes(network.name) 
? describe.skip 
: describe('Raffle unit test',async function(){
    let Raffle, VRFCoordinatorV2Mock,entranceFee,deployer
    const chainId = network.config.chainId

    beforeEach(async ()=>{
       deployer = (await getNamedAccounts()).deployer
       await deployments.fixture(["all"])
       Raffle = await ethers.getContract("Raffle",deployer)
       VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock",deployer)
       entranceFee = await Raffle.getEntranceFee()

    })
    describe("constructor",async ()=>{
        it("it initializes correctly", async ()=>{
            const raffleState = await Raffle.getRaffleState()
            const interval = await Raffle.getInterval()
            assert.equal(raffleState.toString(),'0')
            // assert.equal(interval.toString(),networkConfig[chainId]['interval'])
        })
    })
    describe('enter raffle', async ()=>{
        it('it reverts when not enough ether', async ()=>{
           await expect(Raffle.enterRaffle()).to.be.revertedWith('Raffle__SendMoreToEnterRaffle')
        })
        it("it records player when enter", async ()=>{
            await Raffle.enterRaffle({value : entranceFee})
            const playerFromContract = await Raffle.getPlayer(0)
            assert.equal(playerFromContract,deployer)
        })
    })
    


    

})