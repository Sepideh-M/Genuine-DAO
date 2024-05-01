// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require('hardhat');



async function main() {
  // deployment of test contract; we want to change fee variable in this contract;
  const Age = await ethers.getContractFactory('Age');
  const AgeContract = await Age.deploy();
  await AgeContract.deployed();

  console.log(`AgeContract deployed @ ${AgeContract.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});



// test age contract = 0x98E224d55904720B8b25A604175F05bC1186aB85