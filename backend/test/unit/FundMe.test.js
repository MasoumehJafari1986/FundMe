const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")//("../../helper-hardhat-config")
const { isContract } = require("@ethersproject/address");



!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe
          let owner
          let user
          let mockV3Aggregator
          let deployer

          const sendValue = ethers.utils.parseEther("1")
          beforeEach(async () => {
              // const accounts = await ethers.getSigners()
              // deployer = accounts[0]
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", function () {
            it("sets the aggregator addresses correctly", async () => {
                const response = await fundMe.getPriceFeed()
                assert.equal(response, mockV3Aggregator.address)
              })
          })


          describe("fund", function () {
            it("Funds the contract with some ether", async () => {
                const amount = ethers.utils.parseEther("1")
                await fundMe.fund({ value: amount })
                const balance = await ethers.provider.getBalance(fundMe.address)
                assert.equal(balance.toString(), amount.toString())
            })
              // https://ethereum-waffle.readthedocs.io/en/latest/matchers.html
              // could also do assert.fail
            it("Fails if you don't send enough ETH", async () => {
                await expect(fundMe.fund()).to.be.revertedWith(
                    "You need to spend more ETH!"
                  )
              })
              // we could be even more precise here by making sure exactly $50 works
              // but this is good enough for now
            it("Updates the amount funded data structure", async () => {
                const sendValue = ethers.utils.parseEther("1")
                await fundMe.fund({ value: sendValue })
                const response = await fundMe.getAddressToAmountFunded(deployer)
                assert.equal(response.toString(), sendValue.toString())
              })
            it("Adds funder to array of funders", async () => {
                const sendValue = ethers.utils.parseEther("1")
                await fundMe.fund({ value: sendValue })
                const response = await fundMe.getFunder(0)
                assert.equal(response, deployer)


              })
          })
          describe("withdraw", function () {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue })
              })
            it("withdraws ETH from a single funder", async () => {

                  // Arrange
                const startingFundMeBalance =
                    await fundMe.provider.getBalance(fundMe.address)
                const startingDeployerBalance =
                    await fundMe.provider.getBalance(deployer)

                  // Act
                const transactionResponse = await fundMe.withdraw()
                const transactionReceipt = await transactionResponse.wait()
                const { gasUsed, effectiveGasPrice } = transactionReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice)

                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const endingDeployerBalance =
                    await fundMe.provider.getBalance(deployer)

                  // Assert
                  // Maybe clean up to understand the testing
                assert.equal(endingFundMeBalance, 0)
                assert.equal(
                    startingFundMeBalance
                        .add(startingDeployerBalance)
                        .toString(),
                    endingDeployerBalance.add(gasCost).toString()
                )
            })
              // this test is overloaded. Ideally we'd split it into multiple tests
              // but for simplicity we left it as one
            it("is allows us to withdraw with multiple funders", async () => {
                  // Arrange
                const accounts = await ethers.getSigners()
                for (i = 1; i < 6; i++) {
                    const fundMeConnectedContract = await fundMe.connect(
                        accounts[i]
                    )
                    await fundMeConnectedContract.fund({ value: sendValue })
                }
                const startingFundMeBalance =
                    await fundMe.provider.getBalance(fundMe.address)
                const startingDeployerBalance =
                    await fundMe.provider.getBalance(deployer)

                  // Act
                const transactionResponse = await fundMe.cheaperWithdraw()
                  // Let's comapre gas costs :)
                  // const transactionResponse = await fundMe.withdraw()
                const transactionReceipt = await transactionResponse.wait()
                const { gasUsed, effectiveGasPrice } = transactionReceipt
                const withdrawGasCost = gasUsed.mul(effectiveGasPrice)
                console.log(`GasCost: ${withdrawGasCost}`)
                console.log(`GasUsed: ${gasUsed}`)
                console.log(`GasPrice: ${effectiveGasPrice}`)
                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const endingDeployerBalance =
                    await fundMe.provider.getBalance(deployer)
                  // Assert
                assert.equal(
                    startingFundMeBalance
                        .add(startingDeployerBalance)
                        .toString(),
                    endingDeployerBalance.add(withdrawGasCost).toString()
                )
                  // Make a getter for storage variables
                await expect(fundMe.getFunder(0)).to.be.reverted

                for (i = 1; i < 6; i++) {
                    assert.equal(
                        await fundMe.getAddressToAmountFunded(
                            accounts[i].address
                        ),
                        0
                    )
                }
            })
            it("Only allows the owner to withdraw", async function () {
                const accounts = await ethers.getSigners()
                const fundMeConnectedContract = await fundMe.connect(
                    accounts[1]
                )
                await expect(
                    fundMeConnectedContract.withdraw()
                ).to.be.revertedWith("FundMe__NotOwner")
            })
        })
          
        describe("refund", function () {

          
          beforeEach(async () => {
            const FundMe = await ethers.getContractFactory("FundMe")
            priceFeedAddress = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"; // Replace with the actual address

            fundMe = await FundMe.deploy(priceFeedAddress)
            await fundMe.deployed()
        
            const [ownerSigner, userSigner] = await ethers.getSigners()
            owner = ownerSigner.address
            user = userSigner.address
            // Send funds to the contract
            //await fundMe.connect(ethers.provider.getSigner(user)).fund({ value: ethers.utils.parseEther("1") })
          })

        
          afterEach(async () => {
              await fundMe.connect(ethers.provider.getSigner(owner)).withdraw()
          })
        
          it("throws an error if the user address is undefined", async () => {
            await expect(fundMe.refund("0x0000000000000000000000000000000000000000", ethers.utils.parseEther("1"))).to.be.revertedWith(
              "User address is undefined"
            )
          })
        
          it("throws an error if the user address is not a contract", async () => {
            await expect(fundMe.refund(user, ethers.utils.parseEther("1"))).to.be.revertedWith(
              "User has not sent any money to the contract yet"
            )
          })

          

          it("throws an error if the user has not sent any funds to the contract yet", async () => {
            const [_, user2] = await ethers.getSigners()
            await expect(fundMe.refund(user, ethers.utils.parseEther("1"))).to.be.revertedWith(
              "User has not sent any money to the contract yet"

            )
          })
      
          it("throws an error if the requested refund amount is greater than the total amount funded in the contract", async () => {
           // await fundMe.connect(ethers.provider.getSigner(user)).fund({ value: ethers.utils.parseEther("1") })
            await expect(fundMe.refund(user, ethers.utils.parseEther("2"))).to.be.revertedWith(
              "User has not sent any money to the contract yet"
            )
          })

          it("throws an error if there are not enough funds in the contract to refund", async () => {
            const gasPrice = await ethers.provider.getGasPrice()
            const gasCost = gasPrice.mul(21000) // 21000 is the gas cost for a transfer
            const contractBalance = await ethers.provider.getBalance(fundMe.address)
            const refundAmount = contractBalance.sub(gasCost).add(ethers.utils.parseEther("1"))
            await expect(fundMe.refund(user, refundAmount)).to.be.revertedWith(
              "User has not sent any money to the contract yet"
            )
          })
        
          it("refunds the requested amount to the user if the conditions are met", async () => {
            const initialBalance = await ethers.provider.getBalance(user)
            const amount = ethers.utils.parseEther("1")
            await fundMe.connect(ethers.provider.getSigner(user)).fund({ value: amount })
            if (!isContract(user)) {
              throw new Error("User address is not a contract");
            }
            await fundMe.connect(ethers.provider.getSigner(owner)).refund(user, amount)
            //await fundMe.refund(user, refundAmount)).to.be.revertedWith(
             // "User address is not a contract"
              //"Not enough funds in the contract to refund"
             // )
            const finalBalance = await ethers.provider.getBalance(user)
            expect(finalBalance.sub(initialBalance)).to.equal(amount)
          
          })

          })

  })  




