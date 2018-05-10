pragma solidity ^0.4.17;

import "./Sag.sol";

contract SagProxy {
    event PrizeRequest(bytes32 msgHash, uint8 v, bytes32 r, bytes32 s);
    event PrizeReady(address winner, bytes prize);

    Sag private sag;

    address private owner;

    modifier onlyOwner
    {
        require(msg.sender == owner);
        _;
    }

    constructor(address sag_addr) public
    {
        owner = msg.sender;
        sag = Sag(sag_addr);
    }

    function gamble(uint256 guess, uint256 seed) public
    {
        sag.gamble(guess, seed);
    }

    function requestPrize(bytes32 msgHash, uint8 v, bytes32 r, bytes32 s) public
        returns (bool is_winner)
    {
        if (ecrecover(msgHash, v, r, s) == msg.sender && sag.isWinner(msg.sender)) {
            emit PrizeRequest(msgHash, v, r, s);
            return true;
        }
        return false;
    }

    function deliverPrize(address winner, bytes prize) public onlyOwner
    {
        emit PrizeReady(winner, prize);
    }
}