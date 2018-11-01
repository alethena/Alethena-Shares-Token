# Alethena-Shares-Token
This is the smart contract code for the Alethena shares contract, an ERC20 token intended to make shares tradeable on the blockchain.
It is based on the open-zeppelin library. The key difference is that tokens on lost addresses can be recovered.

Assume Alice lost the key to her address A which she was using to hold ATH shares.
To recover the shares, she can do the following:

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

geth console --rinkeby --rpc --syncmode fast --rpcapi="db,eth,net,web3,personal,web3"

On rinkeby use var AlethenaShares = web3.eth.contract(abiArray)
where for abiArray the "[]" needs to be included (see ABICopy file)

Create and unlock user accounts, then go ahead with the commands as in the tests.

The ABI tells you what functions are available and how to use them. 

To flatten: solidity_flattener AlethenaShares.sol
Deployed on rinkeby (transaction output below):

Running migration: 1_initial_migration.js
  Deploying Migrations...
  ... 0x5f8b81b969dac0aab2dd7b5a767dd6e45286d3023843a2261f55a1049fc0eecb
  Migrations: 0x5d03fdb6fb508ba94f6c3d5aa9d1805c5f2a1135
Saving successful migration to network...
  ... 0x6f3bee09f914059a85404c67f804b00f6fd169565baf0c0b7d6bbd14a30fc902
Saving artifacts...
Running migration: 2_deploy_contracts.js
  Deploying AlethenaShares...
  ... 0xe44b55ad6e338c58efd1a47f8df652ed3bf135affbef2af8fbaed86b69c9324c
  AlethenaShares: 0x6351f1c2e6dea96c9c608aa21c89663a3b7ea88e
Saving successful migration to network...
  ... 0x80f79bdacb37da22155a9c4878c5d6fe53bcbe211860a0c1dd8dd1f5c1066919

  Watch on etherscan: https://rinkeby.etherscan.io/address/0x6351f1c2e6dea96c9c608aa21c89663a3b7ea88e