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
            it("picks a winner, resets, and sends money", async () => {
                const additionalEntrances = 3 // to test
                const startingIndex = 2
                const accounts = await ethers.getSigners()
                for (let i = startingIndex; i < startingIndex + additionalEntrances; i++) { // i = 2; i < 5; i=i+1
                    accountConnectedRaffle = Raffle.connect(accounts[i]) // Returns a new instance of the Raffle contract connected to player
                    await accountConnectedRaffle.enterRaffle({ value: entranceFee })
                }
                const startingTimeStamp = await Raffle.getLastTimeStamp() // stores starting timestamp (before we fire our event)

                // This will be more important for our staging tests...
                await new Promise(async (resolve, reject) => {
                    Raffle.once("WinnerPicked", async () => { // event listener for WinnerPicked
                        console.log("WinnerPicked event fired!")
                        // assert throws an error if it fails, so we need to wrap
                        // it in a try/catch so that the promise returns event
                        // if it fails.
                        try {
                            // Now lets get the ending values...
                            const recentWinner = await Raffle.getRecentWinner()
                            const raffleState = await Raffle.getRaffleState()
                            const winnerBalance = await accounts[1].getBalance()
                            const endingTimeStamp = await Raffle.getLastTimeStamp()
                            await expect(Raffle.getPlayer(0)).to.be.reverted
                            // Comparisons to check if our ending values are correct:
                            assert.equal(recentWinner.toString(), accounts[1].address)
                            assert.equal(raffleState, 0)
                            assert.equal(
                                winnerBalance.toString(), 
                                startingBalance // startingBalance + ( (raffleEntranceFee * additionalEntrances) + raffleEntranceFee )
                                    .add(
                                        entranceFee
                                            .mul(additionalEntrances)
                                            .add(entranceFee)
                                    )
                                    .toString()
                            )
                            assert(endingTimeStamp > startingTimeStamp)
                            resolve() // if try passes, resolves the promise 
                        } catch (e) { 
                            reject(e) // if try fails, rejects the promise
                        }
                    })

                    const tx = await Raffle.performUpkeep("0x")
                    const txReceipt = await tx.wait(1)
                    const startingBalance = await accounts[1].getBalance()
                    await VRFCoordinatorV2Mock.fulfillRandomWords(
                        txReceipt.events[1].args.requestId,
                        Raffle.address
                    )
                })
            })
        })
    })
    


    

})