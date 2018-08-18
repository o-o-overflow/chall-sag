# Sag Chall

Ethereum Reversing Challenge

## Overview

This is a reversing challenge based on ethereum smart contract. You need to known some cool features of ethereum to solve this challenge. The contracts will be deployed on public testnet of ethereum, which means everyone can see what's happening on the blockchain, and everyone can confirm if the solution is valid, because all the validation are made in those *smart* contracts, we are only giving out flags to the winner!

## Technical

There are two contracts here: Sag.sol and SagProxy.sol. We are going to provide the source code of the second contract to simplify the game. The player has to figure out the internals of Sag.sol by reversing the evm bytecode of the deployed smart contract.

`SagProxy` is the first interface that user can interact with its *private* contract. The user can invoke `SagProxy.gamble` to play the 'gambling' game in `Sag`. If he wins, he will be recorded in the `Sag`'s storage, then he can ask for the encrypted flag through `SagProxy.requestPrize`. We have a daemon(sagd.js) listening to the events from `SagProxy` and sending flags encrypted by the winner's public key to the winner address. We can not directly give out flags to the winner, because everything in the blockchain is *public*!

It seems that the `sag` instance of `SagProxy` is secret, and user does not need to know its real address, because user can play the gambling game through the public function of the proxy. However, a recorded winner is not allowed to play again, and the address of `SagProxy` is already recorded by admin. This can be verified by calling `Sag.isWinner`.

The first trick the player has to know is that even *private* storage of a contract is still accessible, because every transaction is executed on some random miner, who has to known everything about the execution. That means the private `sag` instance in the `SagProxy` instance is known.

The next step is extracting the bytecode from the `sag`. The second thing that a player will learn is that the bytecode presented in the transaction is basically a loader for the runtime bytecode. You need to extract the runtime bytecode to see more internals of the runtime contract.

The logics in `Sag.gamble` is not very complicated. It generates 32 'random' numbers by hasing the given seed and xoring the sender's address. The sender's address is required in this procedure because it makes sure the payload can not be simply replayed by others. Then contract will sort the random numbers with O(n^2) algorithm. If the user's guess matches the greatest number, the contract will record the winner's address in it's storage.

I assume experienced reverser can recover the solidity code in a few hours? Maybe someone has advanced decompiler and debugger for evm. I don't known.

The third trick is that transactions in ethereum requires gas fee. Every instruction costs some gas. If the gas runs out, then the transaction will be aborted and everything rolls back. The contract sorts a uint256[32] array on *storage* instead of *memory*, which means every swap of two elements uses a lot of gas. There is a modifier `gasLimit` on `Sag.gamble` checking the remaining gas is not too much. If there are too many swaps in the sorting procedure, the transaction will run out of gas and fail. So the seed has to be carefully selected to have as less swaps as possible. The gas of the total execution is linear with the swaps (inverse pairs), the approximate calculation is:

```
    kGasBase = 971436;
    kGasSwap = 10576;
    TotalGas = kGasBase + TotalSwap * kGasSwap
```

~~If we have a gas limit of 200000, the user has to choose a seed with swaps less than (200000 - 971436) / 10576 = 97.25. He could find a good seed by brute forcing.~~ This calculation only applies to the *first* user of this contract, because changing `data` storage from zero to non-zero value is more expensive in gas. Since I tested my exploit before everyone else, it's still a fair game for players in DEFCON CTF quals.

[prob.py](./exploit/prob.py) calculates probabilities of inverse pairs for N(=32) random numbers. We can see that the probability of a random array has inverse pairs less than 97 is 7.74165222216e-08, and you can expect this happens in 12917139.2786 attempts.

For a unlucky attacker, he might need to brute force the seed in a C program, which is what I have done in [calc.c](./exploit/calc.c). The final trap is that ethereum is using an old standard of SHA-3, which differs from the current standard in one constant. It take me some time to find a good sha3 library, I hope other hackers can find it quickly.

Eventually the attacker will recieve a flag encrypted by his own pubkey. To make this procedure less guessing, part of the deamon code is also provided.

## Requirements

The contracts will to be deployed in a public ethereum testnet, [truffle framework](http://truffleframework.com/) is required here.

We have to run a [flag deamon](./src/sagd.js) to monitor events for flag requests. The required packages is listed in [package.json](./src/package.json). The [exploit](./src/exploit.js) has the same dependencies. Both of them has to be run under './src/'.

## TODO

1.  Check PrizeReady event to update winner lists.
2.  Monitor GambleRequest/GambleResult of Sag.
