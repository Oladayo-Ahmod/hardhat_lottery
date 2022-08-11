const { assert, expect } = require('chai')
const { network,ethers,getNamedAccounts,deployments } = require('hardhat')
const { it } = require('mocha')
const {developmentChains, networkConfig} = require('../../helper-config')

!developmentChains.includes(network.name) 
? describe.skip 
: describe('Raffle unit test',async function(){
    let Raffle, VRFCoordinatorV2Mock,entranceFee,deployer,interval
    const chainId = network.config.chainId

    beforeEach(async ()=>{
       deployer = (await getNamedAccounts()).deployer
       await deployments.fixture(["all"])
       Raffle = await ethers.getContract("Raffle",deployer)
       VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock",deployer)
       entranceFee = await Raffle.getEntranceFee()
       interval = await Raffle.getInterval()

    })
    describe("constructor",async ()=>{
        it("it initializes correctly", async ()=>{
            const raffleState = await Raffle.getRaffleState()
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
        it('it emits event on enter', async ()=>{
            await expect(Raffle.enterRaffle({value : entranceFee})).to.be.emit(Raffle,' RaffleEnter')
        })
        // it("it doesn't allow entrance when raffle is calculating", async ()=>{
        //     await Raffle.enterRaffle({value : entranceFee})
        //     await network.provider.send("evm_increaseTime",[interval.toNumber() + 1]) // increase the time to be pass // hardhat evm_increaseTime and mine
        //     await network.provider.request({ method: "evm_mine", params: [] })
        //     await Raffle.performUpkeep([]) // raffle state is now calculating
        //     await expect(Raffle.enterRaffle({value : entranceFee})).to.be.revertedWith("RaffleNotOpen")
            
        // })
        it("doesn't allow entrance when raffle is calculating", async () => {
            await Raffle.enterRaffle({ value: entranceFee })
            // for a documentation of the methods below, go here: https://hardhat.org/hardhat-network/reference
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.request({ method: "evm_mine", params: [] })
            // we pretend to be a keeper for a second
            await Raffle.performUpkeep([]) // changes the state to calculating for our comparison below
            await expect(Raffle.enterRaffle({ value: entranceFee })).to.be.revertedWith( // is reverted as raffle is calculating
                "Raffle__RaffleNotOpen"
            )
        })
    })
    


    

})