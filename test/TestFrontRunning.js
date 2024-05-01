/* eslint-disable prettier/prettier */
const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('DAO TEST', async function () {
  let encodeFunctionCall;

  //define addresses
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addr4;
  let attacker;

  //define contracts
  let NFTContract;
  let GenuineDAOContract;
  let GenuineDAOStorageContract;
  let AgeContract;

  //define blockchain informations
  let TX;
  let BlockNumber;
  let proposalState;

  // voting period is a period that user have time to vote;
  const votingPeriod = 5;
  // voting delay is delay from create proposal to start voting;
  const votingDelay = 5;
  // delay is time between end proposal to start queue TX;
  const Delay = 5;
  // quorumVotes is factor to proposal get success ! i will explain this later;
  const quorumVotes = 0;

  beforeEach(async function () {
    //getting addresses
    [owner, addr1, addr2, addr3, addr4, attacker] = await ethers.getSigners();

    // deployment of test contract; we want to change fee variable in this contract;
    const Age = await ethers.getContractFactory('Age');
    AgeContract = await Age.deploy();
    await AgeContract.deployed();

    // DEPLOYMENT NFTContract
    // this is our erc20 vote token; users are able to vote by this token;
    const NFT = await ethers.getContractFactory('NFTContract');
    NFTContract = await NFT.deploy();
    await NFTContract.deployed();

    // DEPLOYMENT DAO contarct;
    const GenuineDAO = await ethers.getContractFactory('GenuineD');
    GenuineDAOContract = await GenuineDAO.deploy();
    await GenuineDAOContract.deployed();

    // DEPLOYMENT DAO Storage Contarct;
    const GenuineDStorage = await ethers.getContractFactory(
      'GenuineDStorage'
    );
    GenuineDAOStorageContract = await GenuineDStorage.deploy();
    await GenuineDAOStorageContract.deployed();

    // SETUP
    // we need to create signature from function, create create it by abi of contract and function selector;
    encodeFunctionCall = AgeContract.interface.encodeFunctionData(
      'setFee',
      [5]
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


  describe('Test frontrunning attack', () => {
    beforeEach(async () => {
      // mint some vote token to users;
      TX = await NFTContract.mint(
        addr2.address,
        ethers.utils.parseEther('100')
      );
      await TX.wait(1);


      //set automine to false
      await network.provider.send("evm_setAutomine", [false]);
      await network.provider.send("evm_setIntervalMining", [1000]);

       
      //user (addr1) send a transaction for creating a proposal
      await GenuineDAOContract.connect(addr1).proposeToMakeChangeInContract(
              [AgeContract.address],
              [0],
              [encodeFunctionCall],
              []
            )
      

      console.log("User created a proposal transaction with 5 percent fee")
      console.log("Created transaction sent to the mempool")

      // getting all the txs in mempool
      const txs = await ethers.provider.send('eth_getBlockByNumber', [
        'pending',
        true,
      ]);

      // finding the tx
      const tx = txs.transactions.find(
        (tx) => tx.to === GenuineDAOContract.address.toLowerCase()
      );
        
      console.log("Attacker found the pending proposal trasaction")
      
      // Send tx with more gas
      await attacker.sendTransaction({
        to: tx?.to,
        data: tx?.input,
        gasPrice: ethers.BigNumber.from(tx?.gasPrice).add(100),
        gasLimit: ethers.BigNumber.from(tx?.gas).add(100000),
      });

      console.log("Attacker created a new transaction with the same data but higher gas fee ")

      // Mine all the transactions
      await ethers.provider.send('evm_mine', []);

      await network.provider.send("evm_setAutomine", [true]);

      const proposal1 = await GenuineDAOStorageContract.getProposal(1);
      // console.log("propsolas", proposal1.id)
      console.log("Proposal created with ID", Number(proposal1?.id), "and proposer", proposal1.proposer)

      const proposal2 = await GenuineDAOStorageContract.getProposal(2);
      console.log("Proposal created with ID", Number(proposal2?.id), "and proposer", proposal2.proposer)
      
      console.log("Proposal transactions created with different proposal IDs")

      console.log("Genuine DAO prevented double proposals by generating a new proposal ID")

      console.log("All proposals are waited for being voted and executed")
      // delegate vote after proposal create event;
      TX = await NFTContract.connect(addr2).delegate(addr2.address);
      await TX.wait(1);

      // mine block to pass vote delay;
      for (let i = 0; i < 5; i++) {
        ethers.provider.send('evm_mine');
      }

      await expect(GenuineDAOContract.connect(addr2).castVote(1, 1))
        // if TX is ok we expect to see event ;
        .to.emit(GenuineDAOContract, 'VoteCast')
        .withArgs(addr2.address, 1, 1);

      // console.log("Voting process completed successfully")
      
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

      

      //execute transaction
      await GenuineDAOContract.executeTransaction(1);

      


      

      // fee changed successfully and however attacker sent the transaction sooner but he hasn't achieved anything 
      const fee = await AgeContract.getFee();
      

      
    });
  });



});