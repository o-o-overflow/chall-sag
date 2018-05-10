var Sag = artifacts.require('./Sag.sol');
var SagProxy = artifacts.require('./SagProxy.sol');

module.exports = function(deployer) {
    var sag = null;
    var sag_proxy = null;
    deployer.deploy(Sag).then((instance) => {
        sag = instance;
        return deployer.deploy(SagProxy, Sag.address);
    }).then((instance) => {
        sag_proxy = instance;
        return sag.addWinner(sag_proxy.address);
    });
}
