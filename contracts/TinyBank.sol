// staking
// deposit - 예금(MyToken) / withdraw - 출금(MyToken)

//MyToken : token balance management
// - the balance of TinyBank address
// TinyBank : deposit / withdraw vault
// - users token management
// - user --> deposit --> TinyBank --> transfer(user --> tinyBank)

// Reward
// - reward token : MyToken
// - reward resources : 1 MT/block minting
// - reward strategy : staked[user]/totalStaked distribution

// - signer0 block 0 staking
// - signer1 block 5 staking
// - 0- 1- 2- 3- 4- 5--
//               |          |
// - signer0 10MT       signer1 10MT

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IMyToken {
    function transfer(uint256 amount, address to) external;
    
    function transferFrom(address from, address to, uint256 amount) external;

    function mint(uint256 amount, address owner) external;
}

contract TinyBank {
    event Staked(address from, uint256 amount);
    event Withdraw(uint256 amount, address to);

    IMyToken public stakingtoken;

    mapping(address => uint256) public lastClaimedBlock;
    uint256 rewardPerBlock = 1 * 10 ** 18;

    mapping(address => uint256) public staked;
    uint256 public totalStaked;

    constructor(IMyToken _stakingtoken) {
        stakingtoken = _stakingtoken;
    }

//who, when?
   function distributeReward(address to) internal {
        uint256 blocks = block.number - lastClaimedBlock[to];
        uint256 reward = (blocks * rewardPerBlock * staked[to]) / totalStaked;
        stakingtoken.mint(reward, to);
        lastClaimedBlock[to] = block.number;
   }

    function stake(uint256 _amount) external { 
        require(_amount >= 0, "cannot stake 0 amount");
        distributeReward(msg.sender);
        stakingtoken.transferFrom(msg.sender, address(this), _amount);
        staked[msg.sender] += _amount;
        totalStaked += _amount;
        emit Staked(msg.sender, _amount);
    }

    function withdraw(uint256 _amount) external {
        require(staked[msg.sender] >= _amount, "insufficient staked token");
        distributeReward(msg.sender);
        stakingtoken.transfer(_amount, msg.sender);
        staked[msg.sender] -= _amount;
        totalStaked -= _amount; 
        emit Withdraw(_amount, msg.sender);
    }
}