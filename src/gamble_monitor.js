const fs = require('fs');
const Web3 = require('web3');
const EthCrypto = require('eth-crypto');
const contract = require('truffle-contract');
const HDWalletProvider = require("truffle-hdwallet-provider");
const infura_apikey = "L5DOvapkMowLHO7lEjA3";
const mnemonic = "loyal feature another nature pet two addict picture minor chair renew wash";

const kProvider = 'https://ropsten.infura.io/L5DOvapkMowLHO7lEjA3';

var provider = new HDWalletProvider(mnemonic, kProvider, address_index=0);

var target_addr = process.argv[2];
console.debug('target address = ' + target_addr);

var sag_compiled = JSON.parse(fs.readFileSync('build/contracts/Sag.json'));
var Sag = contract({ abi: sag_compiled.abi });
Sag.setProvider(provider);

(async () => {
    try {
        var sag = await Sag.at(target_addr);

        sag.GambleRequest(null, {
            fromBlock: 1,
            address: sag.address,
        }, (_, r) => {
            console.log('GambleRequest', r.args.player);
        });

        sag.GambleResult(null, {
            fromBlock: 1,
            address: sag.address,
        }, (_, r) => {
            console.log('GambleResult', r.args.player, Web3.utils.toHex(r.args.seed));
        });

    } catch (e) {
        console.error(e);
    }
})();
