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
    describe("constructor",()=>{
        it("it initializes correctly", async ()=>{
            const raffleState = await Raffle.getRaffleState()
            assert.equal(raffleState.toString(),'0')
            // assert.equal(interval.toString(),networkConfig[chainId]['interval'])
        })
    })
    describe('enter raffle', ()=>{
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
        it("it doesn't allow entrance when raffle is calculating", async () => {
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

        describe("checkUpKeep",()=>{
            it("it returns false if no eth sent", async () =>{
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.request({ method: "evm_mine", params: [] })
                const { upkeepNeeded } = await Raffle.callStatic.checkUpkeep([])
                assert(!upkeepNeeded)
            })
            it("it returns true if eth sent, time passed and has player", async () =>{
                await Raffle.enterRaffle({value : entranceFee})
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.request({ method: "evm_mine", params: [] })
                const { upkeepNeeded } = await Raffle.callStatic.checkUpkeep([])
                assert(upkeepNeeded)
            })
            it("it returns false if raffle is not open", async ()=>{
                await Raffle.enterRaffle({ value: entranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.request({ method: "evm_mine", params: [] })
                await Raffle.performUpkeep(['0x'])
                const rafflestate = await Raffle.getRaffleState()
                const { upkeepNeeded } = await Raffle.callStatic.checkUpkeep([])
                assert.equal(rafflestate.toString(),'1')
                assert.equal(upkeepNeeded,false)
            })
        })

        describe("perform upkeep", ()=>{
            it("reverts if checkup is false", async () => {
                await expect(Raffle.performUpkeep("0x")).to.be.revertedWith( 
                    "Raffle__UpkeepNotNeeded"
                )
            })
            it("updates the raffle state and emits a requestId", async () => {
                await Raffle.enterRaffle({ value: entranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.request({ method: "evm_mine", params: [] })
                const txResponse = await Raffle.performUpkeep("0x") // emits requestId
                const txReceipt = await txResponse.wait(1) // waits 1 block
                const raffleState = await Raffle.getRaffleState() // updates state
                const requestId = txReceipt.events[1].args.requestId
                assert(requestId.toNumber() > 0)
                assert(raffleState == 1) // 0 = open, 1 = calculating
            })
        })

        describe("fulfillRandomWords", function () {
            beforeEach(async () => {
                await Raffle.enterRaffle({ value: entranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.request({ method: "evm_mine", params: [] })
            })
            it("can only be called after performupkeep", async () => {
                await expect(
                    VRFCoordinatorV2Mock.fulfillRandomWords(0, Raffle.address) // reverts if not fulfilled
                ).to.be.revertedWith("nonexistent request")
                await expect(
                    VRFCoordinatorV2Mock.fulfillRandomWords(1, Raffle.address) // reverts if not fulfilled
                ).to.be.revertedWith("nonexistent request")
            })
        })
    })
    


    

})