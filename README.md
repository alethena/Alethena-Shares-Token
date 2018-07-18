# InstructionToken
This is the instruction token, an ERC20 token intended to make shares tradable on the blockchain.

-----------------------------------------------------------------------------------------------

Try the following commands in your terminal

truffle compile
truffle migrate
truffle console

var IT;
InstructionToken.deployed().then(function(instance){IT=instance});
IT.mint(web3.eth.accounts[0],5);
IT.mint(web3.eth.accounts[1],5);
IT.mint(web3.eth.accounts[2],5);
IT.mint(web3.eth.accounts[3],5);
IT.mint(web3.eth.accounts[4],5);
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
