pragma solidity ^0.4.17;

import "./Sag.sol";

contract SagFactory {
    event RequestRecord(address sender);
    event HallOfFameRecord(bytes32 msgHash, uint8 v, bytes32 r, bytes32 s);
    event PrizeReady(address winner, bytes prize);

    Sag private sagAddress;

    address private owner;

    modifier onlyOwner
    {
        require(msg.sender == owner);
        _;
    }

    constructor() public
    {
        owner = msg.sender;
        sagAddress = new Sag();
    }

    function requestPrize(bytes32 msgHash, uint8 v, bytes32 r, bytes32 s) public
        returns (bool is_winner)
    {
        emit RequestRecord(msg.sender);

        if (ecrecover(msgHash, v, r, s) == msg.sender) {
            emit HallOfFameRecord(msgHash, v, r, s);
            return true;
        } else {
            return false;
        }
    }

    function deliverPrize(address winner, bytes prize) public onlyOwner
    {
        emit PrizeReady(winner, prize);
    }
}