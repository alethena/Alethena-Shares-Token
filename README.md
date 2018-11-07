# Alethena-Shares-Token

**Abstract**
This is the smart contract code for the Alethena shares contract, an ERC20 token intended to make shares tradeable on the blockchain.
It is based on the open-zeppelin library with the key difference that tokens on lost addresses can be recovered.
If you are interested, contact us at contact@alethena.com or get into contact with one of our team members.

**Concept**
In case of tokens that represent real-world assets such as shares of a company, one needs a way to handle lost private keys. With physical certificates, courts can declare share certificates as invalid so the company can issue replacements. Here, we want a solution that does not depend on third parties to resolve such cases. Instead, when someone has lost a private key, they can use the `declareLost` function to post a deposit and claim that the shares assigned to a specific address are lost. To prevent frontrunning, a commit reveal scheme is used. If the user actually owns the shares, he needs to wait for a certain period and can then reclaim the lost shares as well as the deposit. If the user is an attacker trying to claim shares belonging to someone else, the attacker risks losing the deposit as it can be claimed at any time by the rightful owner. Furthermore, the company itself can delete claims at any time (the deposit will be refunded however). So in order to use this functionality, one needs to trust the company to do the right thing and to handle potential disputes responsibly. If you do not trust the company to do so, don't lose your private keys. :)

**Structure**
The main contract is `AlethenaShares.sol`, it is based on a standard ERC20 token (`ERC20.sol`, `ERC20Basic.sol`) and `SafeMath.sol` is used to protect against overflow in arithmetic operations. 
Ownership management is handled by `Ownable.sol`, with three types of users:
- Standard users can use all the standard ERC20 functionality and make claims as outlined below
- The `owner` can additionally change the total number of shares, mint, unmint and tokens, delete claims and pause the contract. 
- The `master` is hardcoded and can change the owner by calling `transferOwnership`

All significant changes (relating to the share recovery) are contained in **`Claimable.sol`** 

**The main functionality  of `claimable.sol`**
Let us consider an example:

Assume that Alice lost the key to her address A which she was using to hold ATH shares.
To recover the shares, she can do the following:

1. From an address B, she calls the `prepareClaim` function and submits a package cosisting of the hash of the string concatenation of 
- `a nonce`
- `address B`
- `address A`

The hashed package (along with a timestamp) gets stored as a struct in a mapping with key `address B`. Additionally `address B` is emitted in an event. 

2. After waiting sufficiently long (as defined by the `preClaimPeriod`), Alice will call the `declareLost` function from address B with the following arguments:
- `address A`
- the `nonce` used in step 1
Furthermore, in this function call she needs to send a sufficient amount of ether to be used as collateral (as defined by the `collateralRate`).
For the claim to be valid the following conditions need to be fulfilled:
- there needs to exist a preclaim made by address B
- the preclaim should be no older than two times the `preClaimPeriod` and no younger than the `preClaimPeriod`
- the message value should be >= the product of the number of shares held on address A times the `collateralRate`
- the hash of the string concatenation of the function arguments provided (along with the sender address) should match the hashed package of the preclaim.
As a result, the claim consisting of the claimant (address B), the collateral value and a timestamp gets stored as a struct in a mapping with key `address A`.
Additionally, an event with the same information is emitted.

3. Again after waiting for a while, this time defined by `claimPeriod`, Alice gets her shares back by calling the function `resolveClaim` with the argument `address A`.
Before this happens, the following conditions are checked:
- There exists a claim for `address A`
- The claimant of that claim is `address B`
- The claim was made at least `claimPeriod` ago
This will transfer the tokens from address A to address B and return the ether collateral back to Alice. The claim is deleted, the lost address, claimant and collateral are emitted in an event.

**Additional functionality of claimable.sol**
1. The **owner can set the `collateralRate` and `claimPeriod`**, which are to be entered in wei and days respectively. The `collateralRate` must be strictly greater than zero and the `claimPeriod` cannot be shorter than 30 days. After changing the claim parameters an event is emitted.
2. If a **key is found again** (or a malicious claim is made), the **`clearClaim`** function can be called (with no arguments) from the claimed address. if there is a claim with non-zero collateral on that account, the claim will be deleted, and the collateral transferred to the previously claimed address. 
**Important:** If a transfer is made from an account that is being claimed, this implies that the key is not lost. Consequently, the `clearClaim` function is automatically called. this is implemented in the `transfer` function of `AlthenaShares.sol`.
3. The **`totalShares`** variable repsresents the number of all shares from this shareclass. There may be a situation where not all shares are actually tokenised. The number of tokenised shares is tracked by the **`totalSupply`** variable which is adjusted dynamically and cannot exceed `totalShares`. Similarly, when the `totalShares` variable is changed by the owner using `setTotalShares` it must be at least `totalSupply`.
4. The owner can **mint** tokens to an address provided as an argument to the `mint` function. The mint amount must be positive and the new `totalSupply` cannot exceed `totalShares`. An event is emitted is extremely important, because it is picked up by the shareholder register.
5. In case shares need to be taken offline or a capital decrease occurs, the owner can transfer shares to the owner account and **`unmint`** (but only the shares on the owner address). 
6. In case of a hard fork or other serious issues, the contract can be **paused** by the owner. As a result, no transactions can be made anymore. An event is emitted containing a boolean (paused true/false), a message, the new contract address (if applicable, else 0), and an integer representing the number of the last block considered valid. To unpause, the same function is called to set the boolean to false. 

**Comments:**
There can only be one claim per address at a time. To prevent frontrunning, the commit-reveal mechanism was employed.
An attacker obtains no advantage from copying preClaims made by others because he cannot send from their account (and this information is part of the hashed package), i.e. the attacker would only know what preClaim to make once the lost address has been revealed (at which point he would have to wait the preClaim period while the true owners `declareLost` call goes through). 
A preclaim is valid only for a relatively short time. This makes it impractical to constantly make preclaims on all addresses, furthermore, systematically abusing the functionality opens an attacker up to high potential losses. 

**Significance of events:**
1. Transfer events are picked up by the share holder register tool. The business logic behind this is explained in the share token terms (section XXXX). 
In a nutshell, a one-to-one mapping from addresses to shares is maintained using a 'first in, first out' logic. Let's consider an example:
Assume A and B both own 5 tokens and have registered in the shareholder register. This means that they are both shareholders with full rights.
Assume now that first A, and then B transfer their token to an address C. C now owns the tokens but does not register as a shareholder and sends 6 tokens to E and 4 tokens to F.
Assume that E now registers as a shareholder, but not F.
Block, transaction index and log index provide a strict ordering of transactions which is immutable. In this sense, let us assume that the transfer to E happended before the transfer to F.
The result is that the shareholder rights for all 5 shares of A are transferred to E, shareholder rights for one share is transferred from B to F, but B retains shareholder rights for his shares 2-5.
2. Mint events are similarly picked up by the share holder register tool.
3. Claim and preclaim events allow users to track claims made.

-----------------------------------------------------------------------------------------------

**Trying it out locally in TRUFFLE/GANACHE**
(Get truffle and ganache here https://truffleframework.com/)
Clone the GitHub Repo.
Try the following commands in your terminal (you need to be in the directory containing the config files):

`truffle compile`
`truffle migrate`
`truffle console`

Instantiate the contract in the truffle console with:

`var AS;`
`AlethenaShares.deployed().then(function(instance){AS=instance});`

You can run the unit tests with (Ganache needs to be running on the right port):

`truffle test`

If you are using Ganache make sure that you have 10 accounts available which get 100 Ether or more at the beginning as tests might run out of funds otherwise.

------------------------------------------------
**RINKEBY (ETHEREUM TESTNET):**

To interact with the preliminary contract on rinkeby, start a node with

`geth console --rinkeby --rpc --syncmode fast --rpcapi="db,eth,net,web3,personal,web3"`

On rinkeby use `var AlethenaShares = web3.eth.contract(abiArray)`

Create and unlock user accounts, then go ahead with the commands as in the tests.

The ABI tells you what functions are available and how to use them. 

Watch a preliminary version of the contract on etherscan: [Alethena Shares (ATH) Token Tracker](https://rinkeby.etherscan.io/token/0x6351f1c2e6dea96c9c608aa21c89663a3b7ea88e)
Alternatively, you can interact directly with the contract on etherscan using the write contract functionality and MetaMask.