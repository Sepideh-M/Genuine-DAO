//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Age is Ownable {
    // is 0 at start !
    uint256 private age;

    function getFee() public view returns (uint256) {
        return age;
    }

    // there is only owner modifier in set age function; only owner can change this value !:)
    // SO WE HAVE TO TRANSFER OWNERSHIP BEFORE EXECUTE TX;

    function setFee(uint256 _age) public onlyOwner {
        age = _age;
    }
}
