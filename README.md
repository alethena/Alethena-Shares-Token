# Alethena-Share-Token
This is the smart contract code for the Alethena shares contract, an ERC20 token intended to make shares tradeable on the blockchain.
It is based on the open-zeppelin library. The key difference is that tokens on lost addresses can be recovered.

Assume Alice lost the key to her address A which she was using to hold ATH shares.
To revcover the shares, she can do the following:

1. From an address B, she calls the `prepareClaim` function and submits a package cosisting of the hash of the string concatenation of 
    `a nonce`,
    `address B`,
    `address A`.

The hashed package (along with a timestamp) gets stored as a struct in a mapping with key `address B`.

2. After waiting sufficiently long (as defined by the preClaimPeriod), Alice will call the `claimLost` function with the following arguments:
    `address A`,
    `the nonce used in step 1`.
Furthermore, in this function call she needs to send a sufficient amount of ether to be used as collateral (as defined by the collateralRate).

3. Again after waiting for a while, this time defined by `claimPeriod`, Alice gets her shares back by calling the function `resolveClaim`.
This will transfer the tokens from address A to address B and return the ether collateral back to Alice.

There can only be one claim per address at a time. To prevent frontrunning, the commit-reveal mechanism was employed.
An attacker obtains no advantage from copying preClaims made by others because he cannot send from their account (and this information is part of the hashed package), i.e. the attacker would only know what preClaim to make once the lost address has been revealed (at which point he would have to wait the preClaim period while the true owners `declareLost` call goes through).

The contract owner can pause the contract and delete claims but not transfer tokens on behalf of someone else.


-----------------------------------------------------------------------------------------------
TRUFFLE/GANACHE
(Get truffle and ganache here https://truffleframework.com/)

Try the following commands in your terminal (you need to be in the directory containing the config files):

truffle compile
truffle migrate
truffle console

Instantiate the contract in the truffle console with:

var IT;
AlethenaShares.deployed().then(function(instance){IT=instance});

You can run the unit tests with (Ganache needs to be running):

truffle test

If you are using Ganache make sure that the accounts get 100 Ether or more at the beginning as tests might run out of funds otherwise.

------------------------------------------------
RINKEBY (ETHEREUM TESTNET):

To deploy on rinkeby, use truffle migrate --reset --compile-all --network rinkeby

To interact with contract:

geth console --rinkeby

On rinkeby use var InstructionToken = web3.eth.contract(abiArray)
where for abiArray the "[]" needs to be included (see ABICopy file)

Create and unlock user accounts, then go ahead with the commands as in the tests.

The ABI tells you what functions are available and how to use them. 
