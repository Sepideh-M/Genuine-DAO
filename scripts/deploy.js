// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require('hardhat');

// this is setup arguments for every project, we can customize this for any project ! project emans vote token;
const votingPeriod = 15;
// voting delay is delay from create proposal to start voting;
const votingDelay = 5;
// delay is time between end proposal to start queue TX;
const Delay = 5;
// quorumVotes is factor to proposal get success ! i will explain this later;
const quorumVotes = 0;

async function main() {
  // deployment of test contract; we want to change fee variable in this contract;
  const Age = await ethers.getContractFactory('Age');
  const AgeContract = await Age.deploy();
  await AgeContract.deployed();

  console.log(`AgeContract deployed @ ${AgeContract.address}`);

  // DEPLOYMENT NFTContract
  // this is our erc20 vote token; user's are able to vote by this token;
  const NFT = await ethers.getContractFactory('NFTContract');
  const NFTContract = await NFT.deploy();
  await NFTContract.deployed();

  console.log(`NFTContract deployed @ ${NFTContract.address}`);

  // // DEPLOYMENT DAO contarct;
  const GenuineDAO = await ethers.getContractFactory('GenuineD');
  const GenuineDAOContract = await GenuineDAO.deploy();
  await GenuineDAOContract.deployed();

  console.log(
    `GenuineDAOContract deployed @ ${GenuineDAOContract.address}`
  );

  // // DEPLOYMENT DAO Storage Contarct;
  const GenuineDStorage = await ethers.getContractFactory(
    'GenuineDStorage'
  );
  const GenuineDAOStorageContract = await GenuineDStorage.deploy();
  await GenuineDAOStorageContract.deployed();

  console.log(
    `GenuineDAOStorageContract deployed @ ${GenuineDAOStorageContract.address}`
  );

  // initialize Main Contract;
  TX = await GenuineDAOContract.initializeMainContract(
    AgeContract.address
  );
  await TX.wait(1);

  // initialize storage Contract;
  TX = await GenuineDAOContract.initializeStorage(
    GenuineDAOStorageContract.address
  );
  await TX.wait(1);

  // now setup DAO details;
  await GenuineDAOStorageContract.seterc20VoteToken(
    NFTContract.address
  );
  await GenuineDAOStorageContract.setDelay(Delay);
  await GenuineDAOStorageContract.setVotingPeriod(votingPeriod);
  await GenuineDAOStorageContract.setVotingDelay(votingDelay);
  await GenuineDAOStorageContract.setQuorumVotesBPS(quorumVotes);

  // setup owner of AgeContract to GenuineDAO;
  TX = await AgeContract.transferOwnership(GenuineDAOContract.address);
  await TX.wait(1);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});



/**
 AgeContract deployed @ 0x471eDe9C963681F25AcAd4b83969259902BFC0bc
 NFTContract deployed @ 0xFaD947aC426F799eF6B8146859b31974418B94a3
 GenuineDAOContract deployed @ 0x20650C330867F8012B9DDEBFe706Aee89157699F
 GenuineDAOStorageContract deployed @ 0x96EB4A689692614A9bFb3902B4e7aC928e7D6F2C
 */


 //sepolia contracts
 
 /**
  AgeContract deployed @ 0xF0d8b0Bc47d2F4052dEE162A19f9Ab648b1533c8
  NFTContract deployed @ 0x2861cC936DC9cC4B9eE6aEF97505db649cF3041F
  GenuineDAOContract deployed @ 0xc954a367b45A9e20ce2FEAE4ADbffd5EFd8596D2
  GenuineDAOStorageContract deployed @ 0xa33bbB7f950967747e81E0a908A81f12eEd2a2F0
  */


//mumbai contracts

/**
 AgeContract deployed @ 0xeC4a62ee810f7Fd66a84682efFDa469477cAb15B
NFTContract deployed @ 0x45f15e588f9dFC822C1e36f2137fcEBa3a0Af340
GenuineDAOContract deployed @ 0x9a76e93F73705b83549c439A79B9ab429c8CDd22
GenuineDAOStorageContract deployed @ 0xdEfb5Ee18c011B26c3A7A697C0cF6a7432B0C78B
 */