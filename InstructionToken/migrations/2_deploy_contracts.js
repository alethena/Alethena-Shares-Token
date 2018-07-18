//var SafeMath = artifacts.require("./SafeMath.sol");
//var ERC20Basic = artifacts.require("./ERC20Basic.sol");
//var BasicToken = artifacts.require("./BasicToken.sol");
//var ERC20 = artifacts.require("./ERC20.sol");
var InstructionToken = artifacts.require("./InstructionToken.sol");

module.exports = function(deployer) { 
  //deployer.deploy(SafeMath);
  //deployer.deploy(ERC20Basic);
  //deployer.deploy(BasicToken);
  //deployer.deploy(ERC20);
  deployer.deploy(InstructionToken);
};