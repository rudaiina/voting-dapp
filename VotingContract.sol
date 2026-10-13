// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title A simple on-chain ballot
/// @notice Anyone can vote once per wallet address for one of a fixed list of candidates.
contract VotingContract {

    struct Candidate {
        string name;
        uint256 voteCount;
    }

    Candidate[] public candidates;

    // Tracks which wallet addresses have already voted, so no one can vote twice.
    mapping(address => bool) public hasVoted;

    // Emitted every time a vote is cast — the frontend listens for this to update live.
    event Voted(uint256 indexed candidateIndex, address indexed voter);

    /// @notice The candidate names are set once, when the contract is deployed.
    constructor(string[] memory candidateNames) {
        for (uint256 i = 0; i < candidateNames.length; i++) {
            candidates.push(Candidate({name: candidateNames[i], voteCount: 0}));
        }
    }

    /// @notice Cast a vote for a candidate by their index in the candidates array.
    function vote(uint256 candidateIndex) external {
        require(!hasVoted[msg.sender], "This wallet has already voted");
        require(candidateIndex < candidates.length, "Invalid candidate index");

        hasVoted[msg.sender] = true;
        candidates[candidateIndex].voteCount += 1;

        emit Voted(candidateIndex, msg.sender);
    }

    /// @notice Returns all candidate names and their current vote counts.
    function getCandidates() external view returns (string[] memory names, uint256[] memory voteCounts) {
        names = new string[](candidates.length);
        voteCounts = new uint256[](candidates.length);

        for (uint256 i = 0; i < candidates.length; i++) {
            names[i] = candidates[i].name;
            voteCounts[i] = candidates[i].voteCount;
        }
    }

    /// @notice How many candidates are on the ballot.
    function candidateCount() external view returns (uint256) {
        return candidates.length;
    }
}
