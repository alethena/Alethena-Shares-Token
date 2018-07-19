# InstructionToken
This is the instruction token, an ERC20 token intended to make shares tradable on the blockchain. Test

-----------------------------------------------------------------------------------------------

Try the following commands in your terminal

truffle compile
truffle migrate

(To deploy on rinkeby, use truffle migrate --reset --compile-all --network rinkeby)
(deployed on rinkeby @ "0x9b2f0f75c7a8bb62e566ec4cd473d0b55fd460b2")
truffle console

var IT;
InstructionToken.deployed().then(function(instance){IT=instance});
IT.mint([web3.eth.accounts[0], web3.eth.accounts[1], web3.eth.accounts[2], web3.eth.accounts[3], web3.eth.accounts[4]], [5,5,5,5,5]);

IT.endMinting()

IT.mintable()

IT.declareLost(web3.eth.accounts[0], {from: web3.eth.accounts[9], value: web3.toWei(5)});
IT.declareLost(web3.eth.accounts[1], {from: web3.eth.accounts[9], value: web3.toWei(5)}); 
IT.declareLost(web3.eth.accounts[2], {from: web3.eth.accounts[9], value: web3.toWei(5)});
IT.declareLost(web3.eth.accounts[3], {from: web3.eth.accounts[9], value: web3.toWei(5)}); 
IT.declareLost(web3.eth.accounts[4], {from: web3.eth.accounts[9], value: web3.toWei(5)});  


IT.showClaim(web3.eth.accounts[0], web3.eth.accounts[9])  

IT.transfer(web3.eth.accounts[2],3)

IT.showClaim(web3.eth.accounts[0], web3.eth.accounts[9])  

IT.resolveClaim(web3.eth.accounts[1], {from: web3.eth.accounts[9]})  

web3.eth.getBlock('latest').timestamp

IT.showAllClaims(web3.eth.accounts[0])

IT.setCollateralRate(3*10**18)

IT.declareLost(web3.eth.accounts[0], {from: web3.eth.accounts[7], value: web3.toWei(15)});  

IT.declareLost(web3.eth.accounts[0], {from: web3.eth.accounts[6], value: web3.toWei(14)});  
