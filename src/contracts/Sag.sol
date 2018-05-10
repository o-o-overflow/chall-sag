pragma solidity ^0.4.17;

contract Sag {
    event HasGambleRequest(address sender);
    event GambleResult(address sender, uint256 guess, uint256 max);

    mapping (address => bool) public winners;

    address private owner;

    uint256 private gas_limit;

    uint256[32] private data;

    constructor() public
    {
        owner = msg.sender;
        gas_limit = 3000000;
    }

    modifier gasLimit
    {
        require(gasleft() < gas_limit);
        _;
    }

    modifier onlyOwner
    {
        require(msg.sender == owner);
        _;
    }

    function gamble(uint256 guess, uint256 seed) public gasLimit {
        emit HasGambleRequest(msg.sender);

        require(!winners[msg.sender]);

        uint i;
        uint j;
        uint256 mask = uint256(msg.sender);
        uint256 tmp = seed;
        for (i = 0; i < 32; i++) {
            tmp = uint256(keccak256(tmp)) ^ mask;
            data[i] = tmp;
        }
        for (i = 0; i < 32; i++) {
            for (j = i + 1; j < 32; j++) {
                if (data[i] < data[j]) {
                    tmp = data[i];
                    data[i] = data[j];
                    data[j] = tmp;
                }
            }
        }
        if (guess == data[0]) {
            winners[msg.sender] = true;
        }
        emit GambleResult(msg.sender, guess, data[0]);
    }

    function isWinner(address player) public view
        returns (bool is_winner)
    {
        return winners[player];
    }

    function setGasLimit(uint256 limit) public onlyOwner {
        gas_limit = limit;
    }

    function addWinner(address player) public onlyOwner {
        winners[player] = true;
    }
}
