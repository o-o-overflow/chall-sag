const fs = require('fs');
const Web3 = require('web3');
const EthCrypto = require('eth-crypto');
const contract = require('truffle-contract');

var target_addr = process.argv[2];
console.log('target address = ' + target_addr);

var web3 = new Web3();
const kProvider = 'http://192.168.199.152:8545';
var provider = new Web3.providers.HttpProvider(kProvider)

provider.sendAsync = async function() {
    await this.send.apply(this, arguments);
}

var sagfactory_compiled = JSON.parse(fs.readFileSync('build/contracts/SagFactory.json'));
var SagFactory = contract({abi: sagfactory_compiled.abi});
SagFactory.setProvider(provider);

(async () => {
    try {
        const me = web3.eth.accounts.privateKeyToAccount('0xa5f34f6876b0e6f9936f235ed86fd4e07245da5c2d39f024ff732339ec94dffc');

        console.log('using account', me);

        const msg = 'haha';
        const sig = web3.eth.accounts.sign(msg, me.privateKey);
        console.log('generated signature', sig);

        var sag_factory = await SagFactory.at(target_addr);
        const r = await sag_factory.requestPrize(sig.messageHash, sig.v, sig.r, sig.s, {
            from: me.address,
        });

        console.log('requested prize');

        sag_factory.PrizeReady({
            winner: me.address,
        }, {
            fromBlock: 0,
        }, async (e, r) => {
            if (!e) {
                console.log(r);
                try {
                    const msg = EthCrypto.cipher.parse(r.args.prize.substr(2));
                    console.log('msg', msg);
                    const flag = await EthCrypto.decryptWithPrivateKey(me.privateKey, msg);
                    console.log(flag);
                } catch (e) {
                    console.error(e);
                }
            }
        });

    } catch (e) {
        console.error(e);
    }
})();
