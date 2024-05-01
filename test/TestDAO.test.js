/* eslint-disable prettier/prettier */
const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('DAO TEST', async function () {
  let encodeFunctionCall;

  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addr4;
  let attacker;

  let NFTContract;
  let GenuineDAOContract;
  let GenuineDAOStorageContract;
  let AgeContract;

  let TX;
  let BlockNumber;
  let proposalState;

  // this is setup arguments for every project, we can customize this for any project ! project emans vote token;
  const votingPeriod = 5;
  // voting delay is delay from create proposal to start voting;
  const votingDelay = 5;
  // delay is time between end proposal to start queue TX;
  const Delay = 5;
  // quorumVotes is factor to proposal get success ! i will explain this later;
  const quorumVotes = 0;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4, attacker] = await ethers.getSigners();

    // deployment of test contract; we want to change fee variable in this contract;
    const Age = await ethers.getContractFactory('Age');
    AgeContract = await Age.deploy();
    await AgeContract.deployed();

    // DEPLOYMENT NFTContract
    // this is our erc20 vote token; user's are able to vote by this token;
    const NFT = await ethers.getContractFactory('NFTContract');
    NFTContract = await NFT.deploy();
    await NFTContract.deployed();

    // // DEPLOYMENT DAO contarct;
    const GenuineDAO = await ethers.getContractFactory('GenuineD');
    GenuineDAOContract = await GenuineDAO.deploy();
    await GenuineDAOContract.deployed();

    // // DEPLOYMENT DAO Storage Contarct;
    const GenuineDStorage = await ethers.getContractFactory(
      'GenuineDStorage'
    );
    GenuineDAOStorageContract = await GenuineDStorage.deploy();
    await GenuineDAOStorageContract.deployed();

    // // SETUP
    // we need to create signature from function, create create it by abi of contract and function selector;
    encodeFunctionCall = AgeContract.interface.encodeFunctionData(
      'setFee',
      [50]
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

    // setup owner of AgeContract to GenuineDAO;
    TX = await AgeContract.transferOwnership(
      GenuineDAOContract.address
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
  });

  describe('Create proposal to change fee from 0 to 50 on age contract', () => {
    it('', async () => {
      // create proposal;
      await expect(
        GenuineDAOContract.proposeToMakeChangeInContract(
          [AgeContract.address],
          [0],
          [encodeFunctionCall],
          []
        )
      )
        // after create transaction we expect to get emmited event ;
        .to.emit(GenuineDAOContract, 'ProposalCreated')
        .withArgs(1, owner.address);

      // we created new proposal with id 1, so proposal count should be one.
      expect(await GenuineDAOStorageContract.proposalCount()).equal(1);
    });
  });

  describe('Now vote', () => {
    beforeEach(async () => {
      //  mint some vote token to users;
      TX = await NFTContract.mint(
        addr1.address,
        ethers.utils.parseEther('100')
      );
      await TX.wait(1);

      // create proposal;
      await expect(
        GenuineDAOContract.proposeToMakeChangeInContract(
          [AgeContract.address],
          [0],
          [encodeFunctionCall],
          []
        )
      )
        // after create transaction we expect to get emmited event ;
        .to.emit(GenuineDAOContract, 'ProposalCreated')
        .withArgs(1, owner.address);

      // delegate vote after proposal create event;
      TX = await NFTContract.connect(addr1).delegate(addr1.address);
      await TX.wait(1);

      // mine block to pass vote delay;
      for (let i = 0; i < 5; i++) {
        ethers.provider.send('evm_mine');
      }
    });
    it('', async () => {
      await expect(GenuineDAOContract.connect(addr1).castVote(1, 1))
        // if TX is ok we expect to see event ;
        .to.emit(GenuineDAOContract, 'VoteCast')
        .withArgs(addr1.address, 1, 1);
    });
  });

  describe('Check flash loan attack', () => {
    beforeEach(async () => {
      // create proposal;
      await expect(
        GenuineDAOContract.proposeToMakeChangeInContract(
          [AgeContract.address],
          [0],
          [encodeFunctionCall],
          []
        )
      )
        // after create transaction we expect to get emmited event ;
        .to.emit(GenuineDAOContract, 'ProposalCreated')
        .withArgs(1, owner.address);
    });
    it('', async () => {
      for (let i = 0; i < 5; i++) {
        ethers.provider.send('evm_mine');
      }

      // now we mint amoutn of tokens after proposal created;
      TX = await NFTContract.mint(
        addr3.address,
        ethers.utils.parseEther('100')
      );
      await TX.wait(1);

      // delegate vote after proposal create event;
      TX = await NFTContract.connect(addr3).delegate(addr3.address);
      await TX.wait(1);

      // now check user3 has valid vote or no !;
      BlockNumber = await GenuineDAOStorageContract.getProposal(1);

      const pastVote = await GenuineDAOStorageContract.getPastVotes(
        addr3.address,
        51
      );
      expect(pastVote.toString()).to.equal('0');
    });
  });

  describe('Queue and Execute', () => {
    beforeEach(async () => {
      //  mint some vote token to users;
      TX = await NFTContract.mint(
        addr1.address,
        ethers.utils.parseEther('100')
      );
      await TX.wait(1);

      // create proposal;
      await expect(
        GenuineDAOContract.proposeToMakeChangeInContract(
          [AgeContract.address],
          [0],
          [encodeFunctionCall],
          []
        )
      )
        // after create transaction we expect to get emmited event ;
        .to.emit(GenuineDAOContract, 'ProposalCreated')
        .withArgs(1, owner.address);

      // delegate vote after proposal create event;
      TX = await NFTContract.connect(addr1).delegate(addr1.address);
      await TX.wait(1);

      // mine block to pass vote delay;
      for (let i = 0; i < 5; i++) {
        ethers.provider.send('evm_mine');
      }

      await expect(GenuineDAOContract.connect(addr1).castVote(1, 1))
        // if TX is ok we expect to see event ;
        .to.emit(GenuineDAOContract, 'VoteCast')
        .withArgs(addr1.address, 1, 1);

      // mine block
      for (let i = 0; i < 5; i++) {
        ethers.provider.send('evm_mine');
      }
    });
    it('', async () => {
      // get proposal state;
      proposalState = await GenuineDAOStorageContract.state(1);
      expect(proposalState.toString()).to.equal('4');

      // run queue;
      TX = await GenuineDAOContract.queue(1);
      await TX.wait(1);

      // get proposal state;
      proposalState = await GenuineDAOStorageContract.state(1);
      expect(proposalState.toString()).to.equal('5');

      // mine block TO get eta and run excute;
      for (let i = 0; i < 6; i++) {
        ethers.provider.send('evm_mine');
      }

      TX = await GenuineDAOContract.executeTransaction(1);
      await TX.wait(1);

      const fee = await AgeContract.getFee();
      console.log(fee.toString());
    });
  });

});
