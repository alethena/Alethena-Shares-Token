var AlethenaShares = artifacts.require("./AlethenaShares.sol");

module.exports = function(deployer) { 
  deployer.deploy(AlethenaShares);
};