// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./GenuineDStorage.sol";
import "./Utils/DAOLib.sol";

contract GenuineD {
    GenuineDStorage GenuineDStorageContract;

    address public mainContract;

    event ProposalCreated(uint256 id, address proposer);
    event VoteCast(address indexed voter, uint256 proposalId, uint8 support);
    event ProposalQueued(uint256 id, uint256 eta);

    function initializeStorage(address _GenuineDStorage) public {
        GenuineDStorageContract = GenuineDStorage(_GenuineDStorage);
    }

    function initializeMainContract(address _mainContract) public {
        mainContract = _mainContract;
    }

    // // /////////////////////////////////////////////////////////////// CREATE PROPOSAL TO MAKE CHANGE IN CONTRACT

    function proposeToMakeChangeInContract(
        // contracts
        address[] calldata targets,
        // msg.value
        uint256[] calldata values,
        // function signature
        bytes[] calldata signatures,
        //
        bytes[] calldata calldatas
    ) public returns (uint256) {
        // require that we will do any action with this proposal;
        require(targets.length != 0, "must provide actions");

        // we get last proposal id that provided by msg.sender;
        uint256 _latestProposalId = GenuineDStorageContract.getLatestProposalIds(
            msg.sender
        );

        // if msg.sender has proposal; this proposal state should NOT be active;
        if (_latestProposalId != 0) {
            // get last proposal state from msg.sender
            DAOLib.ProposalState proposersLatestProposalState = GenuineDStorageContract
                    .state(_latestProposalId);
            require(
                // last proposal of msg.sender should not be active;
                proposersLatestProposalState != DAOLib.ProposalState.Active,
                "found an already active proposal"
            );
            require(
                // last proposal of msg.sender should not be pending;
                proposersLatestProposalState != DAOLib.ProposalState.Pending,
                "found an already pending proposal"
            );
        }

        // save token total supply in memory struct;
        uint256 _tokenSupply = GenuineDStorageContract.getTokenSupply();

        // proposal start time should be current block number + voting delay !
        // for exmple current block number is 1; voting delay is 10; start block for this proposal is 11;
        uint256 _startBlock = block.number +
            GenuineDStorageContract.getVotingDelay();
        // voting end block will be proposla start block + voting period !
        uint256 _endBlock = _startBlock +
            GenuineDStorageContract.getVotingPeriod();

        // we increase number of proposals
        GenuineDStorageContract.increaseProposalID();

        // we create proposal in storage mapping; changes will directly save in storage;
        DAOLib.Proposal memory newProposal;

        // set proposal id;
        newProposal.id = GenuineDStorageContract.proposalCount();
        // set proposer;
        newProposal.proposer = msg.sender;

        // how much votes in support we need to set proposal as succeeded;
        newProposal.quorumVotes = bps2Uint(
            GenuineDStorageContract.getQuorumVotesBPS(),
            _tokenSupply
        );
        // this is timestamp that proposal will get executed by GenuineDAO contract; we will set this when proposal get succeeded;
        newProposal.eta = 0;
        // this is list of targets that proposal will make change on them or will interact with them;
        newProposal.targets = targets;
        // this is list of values ; for example msg.value;s that in calls to targets we will user them;
        newProposal.values = values;
        // signature is signature of the function; for example propose function has sign of 2eeed88f;
        newProposal.signatures = signatures;
        // list of calldata that we will user in calls to target;s;
        newProposal.calldatas = calldatas;
        // proposal start block; this is current block + delay time to start vote;
        newProposal.startBlock = _startBlock;
        // time the vote for proposal will get close ! start block + voting period;
        newProposal.endBlock = _endBlock;
        // ************************************** this variable has default value ! we will test them
        // support at start;
        newProposal.forVotes = 0;
        // no votes at start;
        newProposal.againstVotes = 0;
        // - votes at start;
        newProposal.abstainVotes = 0;
        // proposal state for when it get canceled
        newProposal.canceled = false;
        // proposal state when it get executed
        newProposal.executed = false;
        // proposal start when it get vetoed;
        newProposal.vetoed = false;
        // ************************************** this variable has default value !

        GenuineDStorageContract.setProposal(newProposal, newProposal.id);

        GenuineDStorageContract.setLatestProposalIds(
            newProposal.proposer,
            newProposal.id
        );

        emit ProposalCreated(newProposal.id, msg.sender);

        return newProposal.id;
    }

    // // /////////////////////////////////////////////////////////////// VOTE

    function castVote(uint256 proposalId, uint8 support) external {
        castVoteInternal(msg.sender, proposalId, support);
    }

    function castVoteInternal(
        address voter,
        uint256 proposalId,
        uint8 support
    ) internal returns (uint256) {
        require(
            GenuineDStorageContract.state(proposalId) ==
                DAOLib.ProposalState.Active,
            "voting is not started"
        );
        require(support <= 2, "castVoteInternal: invalid vote type");
        DAOLib.Proposal memory _newProposal = GenuineDStorageContract
            .getProposal(proposalId);

        DAOLib.Receipt memory _newreceipt = GenuineDStorageContract.getReceipt(
            proposalId,
            voter
        );
        require(
            _newreceipt.hasVoted == false,
            "castVoteInternal: voter already voted"
        );

        // ***********************************
        uint256 votes = GenuineDStorageContract.getPastVotes(
            voter,
            _newProposal.startBlock - 1
        );
        // ***********************************

        if (votes > 0) {
            if (support == 0) {
                _newProposal.againstVotes = _newProposal.againstVotes + 1;
            } else if (support == 1) {
                _newProposal.forVotes = _newProposal.forVotes + 1;
            } else if (support == 2) {
                _newProposal.abstainVotes = _newProposal.abstainVotes + 1;
            }

            GenuineDStorageContract.setProposal(_newProposal, proposalId);

            GenuineDStorageContract.setReceipt(
                proposalId,
                voter,
                true,
                support,
                votes
            );

            emit VoteCast(voter, proposalId, support);
        }

        // return nummber of votes !
        return votes;
    }

    // // /////////////////////////////////////////////////////////////// TIMELOCK

    function queue(uint256 proposalId) external {
        require(
            GenuineDStorageContract.state(proposalId) ==
                DAOLib.ProposalState.Succeeded,
            "queue: proposal can only be queued if it is succeeded"
        );

        DAOLib.Proposal memory proposal = GenuineDStorageContract.getProposal(
            proposalId
        );

        uint256 eta = block.number + GenuineDStorageContract.getDelay();

        for (uint256 i; i < proposal.targets.length; i++) {
            if (
                !GenuineDStorageContract.getQueuedTransaction(
                    keccak256(abi.encode(proposal.targets[0], eta))
                )
            ) {
                queueTransaction(proposal.targets[i], eta);
            }
        }
        proposal.eta = eta;
        GenuineDStorageContract.setProposal(proposal, proposalId);

        emit ProposalQueued(proposalId, eta);
    }

    function queueTransaction(
        address target,
        uint256 eta
    ) public returns (bytes32) {
        require(
            eta >= block.number + GenuineDStorageContract.getDelay(),
            "Estimated execution block must satisfy delay."
        );

        bytes32 txHash = keccak256(abi.encode(target, eta));
        GenuineDStorageContract.setQueuedTransaction(txHash, true);

        return txHash;
    }

    // // /////////////////////////////////////////////////////////////// EXCUTE

    function executeTransaction(uint256 _proposalID) external returns (bool) {
        DAOLib.Proposal memory _newProposal = GenuineDStorageContract
            .getProposal(_proposalID);

        require(
            GenuineDStorageContract.state(_proposalID) ==
                DAOLib.ProposalState.Queued,
            "1"
        );

        require(
            block.number <=
                _newProposal.eta + GenuineDStorageContract.GRACE_PERIOD(),
            "2"
        );

        require(block.number >= _newProposal.eta, "eta is not reached");

        for (uint256 i; i < _newProposal.targets.length; i++) {
            require(
                execute(
                    _newProposal.targets[i],
                    _newProposal.signatures[i],
                    _newProposal.eta
                ),
                "4"
            );
        }

        return true;
    }

    function execute(
        address _target,
        bytes memory _signatures,
        uint256 _eta
    ) internal returns (bool) {
        bytes32 txHash = keccak256(abi.encode(_target, _eta));

        require(
            GenuineDStorageContract.getQueuedTransaction(txHash) == true,
            "111"
        );

        (bool Ok, ) = mainContract.call{value: 0}(_signatures);
        require(Ok, "final");
        return true;
    }

    // // /////////////////////////////////////////////////////////////// GETTER
    function bps2Uint(
        uint256 bps,
        uint256 number
    ) internal pure returns (uint256) {
        return (number * bps) / 10000;
    }

    receive() external payable {}

    fallback() external payable {}
}
