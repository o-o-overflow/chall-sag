pragma solidity ^0.4.17;

contract Sag {
    event GambleRequest(address player);
    event GambleResult(address player, uint256 seed);
    // event GambleStats(address player, uint256 swap);

    mapping (address => bool) public winners;

    address private owner;

    uint256 private gas_limit;

    uint256[32] private data;

    constructor() public
    {
        owner = msg.sender;
        gas_limit = 2000000;
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
        require(!winners[msg.sender]);

        // if someone is here, he has bypassed the proxy
        emit GambleRequest(msg.sender);

        uint i;
        uint j;
        uint256 mask = uint256(msg.sender);
        uint256 tmp = seed;
        for (i = 0; i < 32; i++) {
            tmp = uint256(keccak256(tmp)) ^ mask;
            data[i] = tmp;
        }

        // uint k = 0;

        for (i = 0; i < 32; i++) {
            for (j = i + 1; j < 32; j++) {
                if (data[i] < data[j]) {
                    // k += 1;
                    tmp = data[i];
                    data[i] = data[j];
                    data[j] = tmp;
                }
            }
        }
        // emit GambleStats(msg.sender, k);

        if (guess == data[0]) {
            emit GambleResult(msg.sender, seed);
            winners[msg.sender] = true;
        }
    }

    function isWinner(address player) public view
        returns (bool is_winner)
    {
        return winners[player];
    }

    function _setGasLimit(uint256 limit) public onlyOwner {
        // obfuscate the function signature, because `setGasLimit(uint256)`
        // is already in someone's database
        gas_limit = limit;
    }

    function _addWinner(address player) public onlyOwner {
        winners[player] = true;
    }
}
