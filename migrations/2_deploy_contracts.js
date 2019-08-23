var GuaCoin = artifacts.require("./GuaCoin.sol");

module.exports = function(deployer) {
  deployer.deploy(GuaCoin);
};