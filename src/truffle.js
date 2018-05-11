const HDWalletProvider = require("truffle-hdwallet-provider");

const infura_apikey = "L5DOvapkMowLHO7lEjA3";
const mnemonic = "loyal feature another nature pet two addict picture minor chair renew wash";

module.exports = {
    networks: {
        development: {
            host: '192.168.199.152',
            port: 8545,
            network_id: "*",
        },
        ropsten: {
            provider: new HDWalletProvider(mnemonic, "https://ropsten.infura.io/" + infura_apikey),
            network_id: 3,
            gas: 4600000,
        },
    },
};
