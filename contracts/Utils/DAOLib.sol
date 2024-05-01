// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

library DAOLib {
    struct Proposal {
        uint256 id;
        address proposer;
        uint256 quorumVotes;
        uint256 eta;
        address[] targets;
        uint256[] values;
        bytes[] signatures;
        bytes[] calldatas;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool canceled;
        bool vetoed;
        bool executed;
    }

    ///  Ballot receipt record for a voter
    struct Receipt {
        ///  Whether or not a vote has been cast
        bool hasVoted;
        ///  Whether or not the voter supports the proposal or abstains
        uint8 support;
        ///  The number of votes the voter had, which were cast
        uint256 votes;
    }

    enum ProposalState {
        Pending,
        Active,
        Canceled,
        Defeated,
        Succeeded,
        Queued,
        Expired,
        Executed,
        Vetoed
    }
}
