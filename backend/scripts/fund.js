const { ethers } = require("hardhat")

async function main() {

  const FundMeFactory = await ethers.getContractFactory("FundMe")
  console.log("Deploying contract...")
  const FundMe= await FundMeFactory.deploy("0xd9145CCE52D386f254917e481eB44e9943F39138")

  //const FundMe= await FundMeFactory.deploy("0X694AA1769357215DE4FAC081bf1f309aDC325306")
  await FundMe.deployed()
  console.log("Deployed contract to: %s" , (FundMe.address))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
