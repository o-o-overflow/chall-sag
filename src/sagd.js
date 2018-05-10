const fs = require('fs');
const Web3 = require('web3');
const EthCrypto = require('eth-crypto');
const contract = require('truffle-contract');

const kHallOfFameDb = 'halloffame.json';
const kFlag = '../flag';
const kProvider = 'http://192.168.199.152:8545';
const FLAG = fs.readFileSync(kFlag);

var provider = new Web3.providers.HttpProvider(kProvider)
var web3 = new Web3(provider);

provider.sendAsync = async function() {
    await this.send.apply(this, arguments);
}

var target_addr = process.argv[2];
console.debug('target address = ' + target_addr);

var sagproxy_compiled = JSON.parse(fs.readFileSync('build/contracts/SagProxy.json'));
var SagProxy = contract({abi: sagproxy_compiled.abi});
SagProxy.setProvider(provider);

var halloffame = fs.existsSync(kHallOfFameDb) ? JSON.parse(fs.readFileSync(kHallOfFameDb)) : {};

(async () => {
    try {
        const me = web3.eth.accounts.privateKeyToAccount('0xb494585d106525a4abf8f70b49864deeeeb8d6c504a08c5c622a6b860ee4b21f');
        console.log('using account', me);
        web3.eth.defaultAccount = me.address;

        var sag_proxy = await SagProxy.at(target_addr);

        sag_proxy.PrizeRequest(null, {
            fromBlock: 1
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
                            from: me.address,
                        });
                        halloffame[addr] = pubkey;
                        fs.writeFileSync(kHallOfFameDb, JSON.stringify(halloffame));
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        })
    } catch (e) {
        console.error(e);
    }
})();
