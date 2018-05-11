const fs = require('fs');
const Web3 = require('web3');
const EthCrypto = require('eth-crypto');
const contract = require('truffle-contract');
const HDWalletProvider = require("truffle-hdwallet-provider");
const infura_apikey = "L5DOvapkMowLHO7lEjA3";
const mnemonic = "loyal feature another nature pet two addict picture minor chair renew wash";

const kHallOfFameDb = 'halloffame.json';
const kFlag = '../flag';
const kProvider = 'https://ropsten.infura.io/L5DOvapkMowLHO7lEjA3';
const FLAG = fs.readFileSync(kFlag);

var provider = new HDWalletProvider(mnemonic, kProvider, address_index=0);
var web3 = new Web3(provider);

var target_addr = process.argv[2];
console.debug('target address = ' + target_addr);

var sagproxy_compiled = JSON.parse(fs.readFileSync('build/contracts/SagProxy.json'));
var SagProxy = contract({abi: sagproxy_compiled.abi});
SagProxy.setProvider(provider);

var halloffame = fs.existsSync(kHallOfFameDb) ? JSON.parse(fs.readFileSync(kHallOfFameDb)) : {};

(async () => {
    try {
        const me = web3.eth.accounts.privateKeyToAccount('0x5a8b07e133cd2b60de7e5b47a91ea298965bae13bfe013134685b588f2c1b9ed');
        console.log('using account', me);
        web3.eth.defaultAccount = me.address;
        const my_addr = provider.getAddress(0);

        if (me.address != web3.utils.toChecksumAddress(my_addr)) {
            throw "invalid address";
        }

        var sag_proxy = await SagProxy.at(target_addr);

        sag_proxy.PrizeRequest(null, {
            fromBlock: 1,
            address: sag_proxy.address,
        }, async (e, r) => {
            if (!e) {
                try {
                    const m = r.args.msgHash;
                    const sig = '0x' + r.args.r.substr(2) + r.args.s.substr(2) + r.args.v.toString(16);
                    console.debug('signature', sig);
                    const pubkey = EthCrypto.recoverPublicKey(sig, m);
                    console.debug('pubkey', pubkey);
                    const addr = EthCrypto.publicKey.toAddress(pubkey);
                    console.debug('request from', addr);
                    if (addr in halloffame) {
                        console.log('duplicated', addr);
                    } else {
                        console.log('new winner', addr);
                        const encrypted = await EthCrypto.encryptWithPublicKey(pubkey, FLAG);
                        console.log('encrypted flag', encrypted);
                        const prize = '0x' + EthCrypto.cipher.stringify(encrypted);
                        console.log('prize for', addr, prize);
                        await sag_proxy.deliverPrize(addr, prize, {
                            gas: 1000000,
                            from: my_addr,
                        });
                        halloffame[addr] = pubkey;
                        fs.writeFileSync(kHallOfFameDb, JSON.stringify(halloffame));
                    }
                } catch (e) {
                    console.error(e);
                }
            } else {
                console.log(e);
            }
        });
    } catch (e) {
        console.error(e);
    }
})();
