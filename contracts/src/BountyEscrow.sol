// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BountyEscrow {
    uint256 public nextBountyId;

    struct Bounty {
        address asker;
        uint256 amount;
        bool paid;
    }

    mapping(uint256 => Bounty) public bounties;

    event BountyPosted(uint256 indexed bountyId, address indexed asker, uint256 amount);
    event BountyAwarded(uint256 indexed bountyId, address indexed winner, uint256 amount);

    function postBounty() external payable returns (uint256) {
        require(msg.value > 0, "Must send MON");
        uint256 id = nextBountyId++;
        bounties[id] = Bounty(msg.sender, msg.value, false);
        emit BountyPosted(id, msg.sender, msg.value);
        return id;
    }

    function awardBounty(uint256 bountyId, address winner) external {
        Bounty storage b = bounties[bountyId];
        require(msg.sender == b.asker, "Only asker");
        require(!b.paid, "Already paid");
        b.paid = true;
        emit BountyAwarded(bountyId, winner, b.amount);
        payable(winner).transfer(b.amount);
    }
}
