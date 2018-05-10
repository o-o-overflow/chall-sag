pragma solidity ^0.4.17;

contract Sag {
    mapping (address => bool) public winners;

    uint256[32] private data;

    function gamble(uint256 max) public {
        require(!winners[msg.sender]);

        uint256 tmp = uint256(msg.sender);
        uint i;
        uint j;
        for (i = 0; i < 32; i++) {
            data[i] = tmp;
            tmp = uint256(keccak256(tmp));
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
        if (max == data[0]) {
            winners[msg.sender] = true;
        }
    }

    function isWinner(address player) public view
        returns (bool is_winner)
    {
        return winners[player];
    }

    function() public payable {
    }
}
