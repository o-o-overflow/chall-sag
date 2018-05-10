// some code would keep running

const EthCrypto = require('eth-crypto');
const FLAG = 'OOO{NOTFLAG}';
const sag_proxy_addr = '0x...';

var halloffame = {};

(async () => {
    try {
        var sag_proxy = await SagProxy.at(sag_proxy_addr);

        sag_proxy.PrizeRequest(null, {
            fromBlock: 1
        }, async (e, r) => {
            const m = r.args.msgHash;
            const sig = '0x' + r.args.r.substr(2) + r.args.s.substr(2) + r.args.v.toString(16);
            const pubkey = EthCrypto.recoverPublicKey(sig, m);
            const addr = EthCrypto.publicKey.toAddress(pubkey);
            if (!(addr in halloffame)) {
                const encrypted = await EthCrypto.encryptWithPublicKey(pubkey, FLAG);
                const prize = '0x' + EthCrypto.cipher.stringify(encrypted);
                await sag_proxy.deliverPrize(addr, prize);
                halloffame[addr] = pubkey;
            }
        })
    } catch (e) {
        console.error(e);
    }
})();
