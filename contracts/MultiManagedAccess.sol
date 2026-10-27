// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

abstract contract MultiManagedAccess {
    uint256 constant MIN_MANAGERS = 3;

    address[] public managers;
    mapping(address => bool) public isManager;
    mapping(address => bool) public confirmed;

    constructor(address[] memory _managers) {
        require(_managers.length >= MIN_MANAGERS, "At least 3 managers required");
        for (uint256 i = 0; i < _managers.length; i++) {
            address m = _managers[i];
            require(m != address(0), "Invalid manager address");
            require(!isManager[m], "Duplicate manager");
            isManager[m] = true;
            managers.push(m);
        }
    }

    modifier onlyManagers() {
        require(isManager[msg.sender], "You are not a manager");
        _;
    }

    modifier onlyAllConfirmed() {
        require(isManager[msg.sender], "You are not a manager");
        for (uint256 i = 0; i < managers.length; i++) {
            require(confirmed[managers[i]], "Not all confirmed yet");
        }
        _;
        _resetConfirmations();
    }

    function confirm() external onlyManagers {
        confirmed[msg.sender] = true;
    }

    function _resetConfirmations() internal {
        for (uint256 i = 0; i < managers.length; i++) {
            confirmed[managers[i]] = false;
        }
    }
}