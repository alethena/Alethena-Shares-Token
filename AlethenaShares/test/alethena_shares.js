//import expectThrow from './tools';
const AlethenaShares = artifacts.require('./AlethenaShares.sol');
const helpers = require('../utilities/helpers.js');
//var Accounts  = require('../node_modules/web3-eth-accounts');
var web3utils = require('web3-utils');

contract('AlethenaShares', (accounts) => {

  // Define the relevant players for the test
  const Owner             = accounts[0]; // This is the owner of the contract, in this case Alethena.
  const Shareholder1      = accounts[1]; // This is a shareholder who loses his key and gets it back using OtherAddress1
  const Shareholder2      = accounts[2]; // This shareholder gets attacked by another user using OtherAddress2
  const Shareholder3      = accounts[3]; // This shareholder gets attacked by another user using OtherAddress3
  const Tokenholder1      = accounts[4];
  const Tokenholder2      = accounts[5];
  const Tokenholder3      = accounts[6];
  const OtherAddress1     = accounts[7]; // Used by Shareholder 1 to get back token
  const OtherAddress2     = accounts[8]; // Used to attack Shareholder2
  const OtherAddress3     = accounts[9]; // Used to attack Shareholder3
  const Master            = "0x0e0a1a8daa228def4a4a8613b3e40aaf435d319e";
  
  // For obvious reasons the following key will not be disclosed in the production version ;-P
  const MasterKey         = "0x60D983AA17D2F806FE7EAC51444DCAF033756E1EF8D2E58303323C44AF9DA876";

  //const MasterAccount = Accounts.privateKeyToAccount(MasterKey);


  // Amounts to be minted for users
  const mintOwner        = 100;
  const mintShareholder1 = 10;
  const mintShareholder2 = 20;
  const mintShareholder3 = 30;
  const totalMinted      = 160;
  const totalSharesInit  = 1000;

  // Have to hardcode this as testrpc and truffle somehow don't work nicely together on this :-() 
  const gasPrice = 100000000000;

  // Get an instance of the token
  let AlethenaSharesInstance;
  before(async () => {
      AlethenaSharesInstance = await AlethenaShares.deployed();
  });
  

  it('should set basic info correctly', async () => {
    console.log("Sanity check: Basic information is correct".green);
    const name     = await AlethenaSharesInstance.name();
    const symbol   = await AlethenaSharesInstance.symbol();
    const decimals = await AlethenaSharesInstance.decimals();
    const totalShares = await AlethenaSharesInstance.totalShares();
    const totalSupply = await AlethenaSharesInstance.totalSupply();

    assert.equal(name, 'Alethena Shares', 'Name incorrect');
    assert.equal(symbol, 'ATH', 'Symbol incorrect');
    assert.equal(decimals, 0, 'Decimals incorrect');
    assert.equal(totalShares, totalSharesInit, 'No. of total shares incorrect');
    assert.equal(totalSupply, 0, 'Total supply is incorrect');
});

  it('should have zero token balances initially', async () => {
    let OwnerBalance = await AlethenaSharesInstance.balanceOf(Owner);  
    let FirstBalance = await AlethenaSharesInstance.balanceOf(Shareholder1); 
    let SecondBalance = await AlethenaSharesInstance.balanceOf(Shareholder2);  

    assert.equal(OwnerBalance, 0, 'Balance incorrect');
    assert.equal(FirstBalance, 0, 'Balance incorrect');
    assert.equal(SecondBalance, 0, 'Balance incorrect');
});

it('should have correct owner and master', async () => {
  let owner = await AlethenaSharesInstance.owner();  
  let master = await AlethenaSharesInstance.master(); 
  assert.equal(Owner.toString(), owner, 'Owner incorrect');
  assert.equal(Master.toString(), master, 'Master incorrect');
});

it('should revert when anyone other than master tries to change the owner', async () => {
  await helpers.shouldRevert( AlethenaSharesInstance.transferOwnership(Shareholder1));
});

  it('should mint correctly', async () => {
    console.log("Check the minting function(s)".green);

    const tx1 = await AlethenaSharesInstance.mint(Owner,mintOwner,'Testing mint');

    let tx2 = await AlethenaSharesInstance.mint(Shareholder1,mintShareholder1,'Testing mint 1');
    let tx3 = await AlethenaSharesInstance.mint(Shareholder2,mintShareholder2,'Testing mint 2');
    let tx4 = await AlethenaSharesInstance.mint(Shareholder3,mintShareholder3,'Testing mint 3');
   

    let OwnerBalance = await AlethenaSharesInstance.balanceOf(Owner);  
    let FirstBalance = await AlethenaSharesInstance.balanceOf(Shareholder1); 
    let SecondBalance = await AlethenaSharesInstance.balanceOf(Shareholder2);
    let ThirdBalance = await AlethenaSharesInstance.balanceOf(Shareholder3);  

    //Test balances
    assert.equal(OwnerBalance, mintOwner, 'Not minted correctly');
    assert.equal(FirstBalance, mintShareholder1, 'Not minted correctly');
    assert.equal(SecondBalance, mintShareholder2, 'Not minted correctly');
    assert.equal(ThirdBalance, mintShareholder3, 'Not minted correctly');  

    const newTotalSupply = await AlethenaSharesInstance.totalSupply()

    //Test that total supply gets adjusted correctly 
    assert.equal(newTotalSupply,totalMinted);

    //Test events
    assert.equal(tx1.logs[0].event,'Mint');
    assert.equal(tx1.logs[0].args.shareholder,Owner);
    assert.equal(tx1.logs[0].args.amount,mintOwner);
    assert.equal(tx1.logs[0].args.message,'Testing mint');
    
    assert.equal(tx2.logs[0].event,'Mint');
    assert.equal(tx2.logs[0].args.shareholder,Shareholder1);
    assert.equal(tx2.logs[0].args.amount,mintShareholder1);
    assert.equal(tx2.logs[0].args.message,'Testing mint 1');

    assert.equal(tx3.logs[0].event,'Mint');
    assert.equal(tx3.logs[0].args.shareholder,Shareholder2);
    assert.equal(tx3.logs[0].args.amount,mintShareholder2);
    assert.equal(tx3.logs[0].args.message,'Testing mint 2');

    assert.equal(tx4.logs[0].event,'Mint');
    assert.equal(tx4.logs[0].args.shareholder,Shareholder3);
    assert.equal(tx4.logs[0].args.amount,mintShareholder3);
    assert.equal(tx4.logs[0].args.message,'Testing mint 3');

});
  
it('should only alow owner to mint', async () => {
  await helpers.shouldRevert(AlethenaSharesInstance.mint(Owner,mintOwner,'Testing mint',{from: Shareholder1}));
});

// it('should only alow owner to batch mint', async () => {
//   await helpers.shouldRevert(AlethenaSharesInstance.mintMany(
//       [Shareholder1, Shareholder2, Shareholder3],
//       [mintShareholder1, mintShareholder2, mintShareholder3],
//       'Testing batch mint',{from: Shareholder1}));
// });

// it('should check for array lengths in batch mint', async () => {
//   await helpers.shouldRevert(AlethenaSharesInstance.mintMany(
//       [Shareholder1, Shareholder2, Shareholder3],
//       [mintShareholder1, mintShareholder2],
//       'Testing batch mint',{from: Owner}));
// });



it('should let OtherAddress1 make a preclaim on Shareholder1', async () => {
  console.log("Case 1: Legitimate claim is made and resolved after waiting period".green);
  // COMPUTE HASHED PACKAGE
  const nonce = web3utils.sha3('Best nonce ever');
  const package = web3utils.soliditySha3(nonce,OtherAddress1,Shareholder1);
  const tx3 = await AlethenaSharesInstance.prepareClaim(web3utils.toHex(package),{from: OtherAddress1});
  let blockstamp = await web3.eth.getBlock('latest').timestamp;
  web3.eth
  
  //Check that data in struct is correct
  assert.equal(package,await AlethenaSharesInstance.getMsgHash(OtherAddress1));
  let temp = await AlethenaSharesInstance.getPreClaimTimeStamp(OtherAddress1);
  assert.equal(blockstamp,temp.toString()); 

  //Test events
  assert.equal(OtherAddress1, tx3.logs[0].args._claimer, 'PreClaim address is incorrect');
 
});


it('should revert when OtherAddress1 tries to make the claim on Shareholder1 too early', async () => {
  const nonce = web3utils.sha3('Best nonce ever');
  const Shareholder1Balance = await AlethenaSharesInstance.balanceOf(Shareholder1);
  const Collateral1 = Shareholder1Balance*10**18;
  await helpers.shouldRevert(AlethenaSharesInstance.declareLost(Shareholder1, nonce, {from: OtherAddress1, value: Collateral1}));
});

it('Increase time', async () => {
  const timeIncrease = 60*60*24+5; //24 hours, s, m, h, d
  await helpers.increaseTime(timeIncrease);
});

it('should revert when OtherAddress1 tries to make the claim on Shareholder1 with the wrong nonce', async () => {
  const nonce = web3utils.sha3('Worst nonce ever');


  
  const Shareholder1Balance = await AlethenaSharesInstance.balanceOf(Shareholder1);
  const Collateral1 = Shareholder1Balance*10**18;
  await helpers.shouldRevert(AlethenaSharesInstance.declareLost(Shareholder1, nonce, {from: OtherAddress1, value: Collateral1}));

});

it('should revert when OtherAddress2 tries to make the claim on Shareholder1 with the correct nonce', async () => {
  const nonce = web3utils.sha3('Best nonce ever');
  const Shareholder1Balance = await AlethenaSharesInstance.balanceOf(Shareholder1);
  const Collateral1 = Shareholder1Balance*10**18;
  await helpers.shouldRevert(AlethenaSharesInstance.declareLost(Shareholder1, nonce, {from: OtherAddress2, value: Collateral1}));

});

it('should revert when OtherAddress1 tries to make the claim on Shareholder2 with the correct nonce', async () => {
  const nonce = web3utils.sha3('Best nonce ever');
  const Shareholder1Balance = await AlethenaSharesInstance.balanceOf(Shareholder1);
  const Collateral1 = Shareholder1Balance*10**18;
  await helpers.shouldRevert(AlethenaSharesInstance.declareLost(Shareholder2, nonce, {from: OtherAddress2, value: Collateral1}));

});

it('should let OtherAddress1 make a claim on Shareholder1', async () => {
  const nonce = web3utils.sha3('Best nonce ever');
  const Shareholder1Balance = await AlethenaSharesInstance.balanceOf(Shareholder1);
  const Collateral1 = Shareholder1Balance*10**18;
  const tx3 = await AlethenaSharesInstance.declareLost(Shareholder1, nonce, {from: OtherAddress1, value: Collateral1});
 
  let blockstamp = web3.eth.getBlock('latest').timestamp;

  //Check that data in struct is correct
  assert.equal(OtherAddress1,await AlethenaSharesInstance.getClaimant(Shareholder1));
  assert.equal(Collateral1,await AlethenaSharesInstance.getCollateral(Shareholder1));
  assert.equal(blockstamp,await AlethenaSharesInstance.getTimeStamp(Shareholder1)); 

  //Check that preClaim is deleted
  assert.equal(0,await AlethenaSharesInstance.getPreClaimTimeStamp(OtherAddress1));
  assert.equal(0,await AlethenaSharesInstance.getMsgHash(OtherAddress1));

  //Test events
  assert.equal(Shareholder1, tx3.logs[0].args._lostAddress, 'Lost address is incorrect');
  assert.equal(OtherAddress1, tx3.logs[0].args._claimant, 'Claimant address is incorrect');
  assert.equal(Shareholder1Balance.toString(), tx3.logs[0].args._balance.toString(), 'Balance is incorrect');

});



it('should reject clearing the claim on Shareholder1 before the waiting period is over', async () => {
  await helpers.shouldRevert(AlethenaSharesInstance.resolveClaim(Shareholder1,{from: OtherAddress1}));
});

it('Increase time', async () => {
  const timeIncrease = 60*60*24*300; //300 days, s, m, h, d
  await helpers.increaseTime(timeIncrease);
});

it('should allow to resolve the claim on Shareholder1 after the waiting period is over', async () => {
  //Record state before
  const OtherAddress1Balance = await AlethenaSharesInstance.balanceOf(OtherAddress1);
  const OtherAddress1EtherBalance = await web3.eth.getBalance(OtherAddress1);
  const Collateral7 = await AlethenaSharesInstance.getCollateral(Shareholder1);
  const Shareholder1BalanceBefore = await AlethenaSharesInstance.balanceOf(Shareholder1);

  //Resolve the claim
  const tx7 = await AlethenaSharesInstance.resolveClaim(Shareholder1,{from: OtherAddress1});
  const gasUsed7 = tx7.receipt.gasUsed;

  //Check that struct was deleted
  assert.equal('0x0000000000000000000000000000000000000000',await AlethenaSharesInstance.getClaimant(Shareholder1));
  assert.equal(0,await AlethenaSharesInstance.getCollateral(Shareholder1));
  assert.equal(0,await AlethenaSharesInstance.getTimeStamp(Shareholder1));

  //Check that tokens were transferred
  const OtherAddress1BalanceAfter = await AlethenaSharesInstance.balanceOf(OtherAddress1)  
  assert.equal(OtherAddress1Balance.plus(Shareholder1BalanceBefore).toString(),OtherAddress1BalanceAfter.toString());
  assert.equal(0,await AlethenaSharesInstance.balanceOf(Shareholder1));

  //Give collateral back
  const txCost7 =gasPrice*gasUsed7; 
  BalShouldBe = OtherAddress1EtherBalance.plus(Collateral7).minus(txCost7).toString();
  BalIs = await web3.eth.getBalance(OtherAddress1).toString();  
  assert.equal(BalIs,BalShouldBe);
});

it('should let OtherAddress1 make a preclaim on Shareholder2', async () => {
  // COMPUTE HASHED PACKAGE
  const nonce = web3utils.sha3('Even better nonce');
  const package = web3utils.soliditySha3(nonce,OtherAddress1,Shareholder2);
  const tx3 = await AlethenaSharesInstance.prepareClaim(web3utils.toHex(package),{from: OtherAddress1});
  let blockstamp = await web3.eth.getBlock('latest').timestamp;
  
  //Check that data in struct is correct
  assert.equal(package,await AlethenaSharesInstance.getMsgHash(OtherAddress1));
  let temp = await AlethenaSharesInstance.getPreClaimTimeStamp(OtherAddress1);
  assert.equal(blockstamp,temp.toString()); 

  //Test events
  assert.equal(OtherAddress1, tx3.logs[0].args._claimer, 'PreClaim address is incorrect');
 
});

it("should revert if a claim doesn't have enough funding", async () => {
  const nonce = web3utils.sha3('Even better nonce');
  await helpers.shouldRevert(AlethenaSharesInstance.declareLost(Shareholder2, nonce,{from: OtherAddress1, value: 10*10**18}));
});

it("should revert if target address has zero balance", async () => {
  const nonce = web3utils.sha3('Even better nonce');
  await helpers.shouldRevert(AlethenaSharesInstance.declareLost(Tokenholder3, nonce,{from: OtherAddress1, value: 10*10**18}));
});

it('should let OtherAddress2 make a preclaim on Shareholder2', async () => {
  // COMPUTE HASHED PACKAGE
  const nonce = web3utils.sha3('Wow that nonce');
  const package = web3utils.soliditySha3(nonce,OtherAddress2,Shareholder2);
  const tx3 = await AlethenaSharesInstance.prepareClaim(web3utils.toHex(package),{from: OtherAddress2});
  let blockstamp = web3.eth.getBlock('latest').timestamp;
  
  //Check that data in struct is correct
  assert.equal(package,await AlethenaSharesInstance.getMsgHash(OtherAddress2));
  let temp = await AlethenaSharesInstance.getPreClaimTimeStamp(OtherAddress2);
  assert.equal(blockstamp,temp.toString()); 

  //Test events
  assert.equal(OtherAddress2, tx3.logs[0].args._claimer, 'PreClaim address is incorrect');

});

it('Increase time', async () => {
  const timeIncrease = 60*60*24+5; //24 hours, s, m, h, d
  await helpers.increaseTime(timeIncrease);
});

it('should let OtherAddress2 make a claim on Shareholder2', async () => {
  console.log("Case 2: Malicious or accidental claim is made but cleared by a transaction".green);
  const nonce = web3utils.sha3('Wow that nonce');
  ShareHolder2Balance = await AlethenaSharesInstance.balanceOf(Shareholder2);
  Collateral2 = ShareHolder2Balance*10**18;
  const tx4 = await AlethenaSharesInstance.declareLost(Shareholder2, nonce, {from: OtherAddress2, value: Collateral2});
  blockstamp =  web3.eth.getBlock('latest').timestamp;

  // Check that data in struct is correct
  assert.equal(OtherAddress2,await AlethenaSharesInstance.getClaimant(Shareholder2));
  assert.equal(Collateral2,await AlethenaSharesInstance.getCollateral(Shareholder2));
  assert.equal(blockstamp,await AlethenaSharesInstance.getTimeStamp(Shareholder2)); 
});


it('should let OtherAddress3 make a preclaim on Shareholder2', async () => {
  // COMPUTE HASHED PACKAGE
  const nonce = web3utils.sha3('Even better nonce 2');
  const package = web3utils.soliditySha3(nonce,OtherAddress3,Shareholder2);
  const tx3 = await AlethenaSharesInstance.prepareClaim(web3utils.toHex(package),{from: OtherAddress3});
  let blockstamp = web3.eth.getBlock('latest').timestamp;
  
  //Check that data in struct is correct
  assert.equal(package,await AlethenaSharesInstance.getMsgHash(OtherAddress3));
  let temp = await AlethenaSharesInstance.getPreClaimTimeStamp(OtherAddress3);
  assert.equal(blockstamp,temp.toString()); 

  //Test events
  assert.equal(OtherAddress3, tx3.logs[0].args._claimer, 'PreClaim address is incorrect');
 
});

it('Increase time', async () => {
  const timeIncrease = 60*60*24+5; //24 hours, s, m, h, d
  await helpers.increaseTime(timeIncrease);
});

it("should revert claim on Shareholder2 because target address is already claimed", async () => {
  const nonce = web3utils.sha3('Even better nonce 2');
  await helpers.shouldRevert(AlethenaSharesInstance.declareLost(Shareholder2, nonce ,{from: OtherAddress3, value: 10*10**18}));
});

it('should clear claim on OtherAddress2 after a transaction', async () => {
  var tx5 = await AlethenaSharesInstance.transfer(Tokenholder2,5,{from: Shareholder2});
  
  //Check that struct was deleted
  assert.equal('0x0000000000000000000000000000000000000000',await AlethenaSharesInstance.getClaimant(Shareholder2));
  assert.equal(0,await AlethenaSharesInstance.getCollateral(Shareholder2));
  assert.equal(0,await AlethenaSharesInstance.getTimeStamp(Shareholder2)); 
});

it('should let OtherAddress3 make a preclaim on Shareholder3', async () => {
  // COMPUTE HASHED PACKAGE
  const nonce = web3utils.sha3('Even better nonce 3');
  const package = web3utils.soliditySha3(nonce,OtherAddress3,Shareholder3);
  const tx3 = await AlethenaSharesInstance.prepareClaim(web3utils.toHex(package),{from: OtherAddress3});
  let blockstamp = web3.eth.getBlock('latest').timestamp;
  
  //Check that data in struct is correct
  assert.equal(package,await AlethenaSharesInstance.getMsgHash(OtherAddress3));
  let temp = await AlethenaSharesInstance.getPreClaimTimeStamp(OtherAddress3);
  assert.equal(blockstamp,temp.toString()); 

  //Test events
  assert.equal(OtherAddress3, tx3.logs[0].args._claimer, 'PreClaim address is incorrect');
 
});

it('Increase time', async () => {
  const timeIncrease = 60*60*24+5; //24 hours, s, m, h, d
  await helpers.increaseTime(timeIncrease);
});


it('should let OtherAddress3 make a claim on Shareholder3', async () => {
  console.log("Case 3: A claim is made but deleted by the owner of the contract".green);
  let ShareHolder3Balance = await AlethenaSharesInstance.balanceOf(Shareholder3);
  Collateral3 = ShareHolder3Balance*10**18
  const nonce = web3utils.sha3('Even better nonce 3');
  await AlethenaSharesInstance.declareLost(Shareholder3, nonce,{from: OtherAddress3, value: Collateral3});
  blockstamp =  web3.eth.getBlock('latest').timestamp;

  //Check that data in struct is correct
  assert.equal(OtherAddress3,await AlethenaSharesInstance.getClaimant(Shareholder3));
  assert.equal(Collateral3,await AlethenaSharesInstance.getCollateral(Shareholder3));
  assert.equal(blockstamp,await AlethenaSharesInstance.getTimeStamp(Shareholder3)); 
});

it('should revert when anyone other than the owner calls deleteClaim', async () => {
  await helpers.shouldRevert(AlethenaSharesInstance.deleteClaim(Shareholder3,{from: Shareholder1}));
});

it('should delete claim on OtherAddress3 when triggered by owner of the contract', async () => {
  let OtherAddress3EtherBalance = await web3.eth.getBalance(OtherAddress3);
  await AlethenaSharesInstance.deleteClaim(Shareholder3,{from: Owner});
  //Check that struct was deleted
  assert.equal('0x0000000000000000000000000000000000000000',await AlethenaSharesInstance.getClaimant(Shareholder3));
  assert.equal(0,await AlethenaSharesInstance.getCollateral(Shareholder3));
  assert.equal(0,await AlethenaSharesInstance.getTimeStamp(Shareholder3));
 
  let BalShouldBe = OtherAddress3EtherBalance.plus(Collateral3).toString();
  let BalIs = await web3.eth.getBalance(OtherAddress3).toString();

  //Check that collateral was returned
  assert.equal(BalShouldBe,BalIs);

});

it('should let OtherAddress3 make a preclaim again on Shareholder3', async () => {
  console.log("Case 4: A claim is made but cleared by owner of claimed address".green);

  // COMPUTE HASHED PACKAGE
  const nonce = web3utils.sha3('Even better nonce 3');
  const package = web3utils.soliditySha3(nonce,OtherAddress3,Shareholder3);
  const tx3 = await AlethenaSharesInstance.prepareClaim(web3utils.toHex(package),{from: OtherAddress3});
  let blockstamp = web3.eth.getBlock('latest').timestamp;
  
  //Check that data in struct is correct
  assert.equal(package,await AlethenaSharesInstance.getMsgHash(OtherAddress3));
  let temp = await AlethenaSharesInstance.getPreClaimTimeStamp(OtherAddress3);
  assert.equal(blockstamp,temp.toString()); 

  //Test events
  assert.equal(OtherAddress3, tx3.logs[0].args._claimer, 'PreClaim address is incorrect');
 
});

it('Increase time', async () => {
  const timeIncrease = 60*60*24+5; //24 hours, s, m, h, d
  await helpers.increaseTime(timeIncrease);
});

it('should let OtherAddress3 make a claim again on Shareholder3', async () => {
  const nonce = web3utils.sha3('Even better nonce 3');
  ShareHolder3Balance = await AlethenaSharesInstance.balanceOf(Shareholder3);
  Collateral3 = ShareHolder3Balance*10**18
  await AlethenaSharesInstance.declareLost(Shareholder3, nonce,{from: OtherAddress3, value: Collateral3});
  blockstamp =  web3.eth.getBlock('latest').timestamp;

  //Check that data in struct is correct
  assert.equal(OtherAddress3,await AlethenaSharesInstance.getClaimant(Shareholder3));
  assert.equal(Collateral3,await AlethenaSharesInstance.getCollateral(Shareholder3));
  assert.equal(blockstamp,await AlethenaSharesInstance.getTimeStamp(Shareholder3)); 
});


it('should clear the claim on OtherAddress3 when triggered by the owner of the claimed address', async () => {
  let Shareholder3EtherBalance = await web3.eth.getBalance(Shareholder3);
  const tx6 = await AlethenaSharesInstance.clearClaim({from: Shareholder3});
  const gasUsed = tx6.receipt.gasUsed;

  //Check that struct was deleted
  assert.equal('0x0000000000000000000000000000000000000000',await AlethenaSharesInstance.getClaimant(Shareholder3));
  assert.equal(0,await AlethenaSharesInstance.getCollateral(Shareholder3));
  assert.equal(0,await AlethenaSharesInstance.getTimeStamp(Shareholder3));
  
  //Check that collateral is payed out correctly - have to account for transaction cost
  const txCost =gasPrice*gasUsed; 
  BalShouldBe = Shareholder3EtherBalance.plus(Collateral3).minus(txCost).toString();
  BalIs = await web3.eth.getBalance(Shareholder3).toString();  
  assert.equal(BalIs,BalShouldBe);
});

it('should unmint correctly from the owner account', async () => {
  console.log("Testing the unmint function".green);
  await AlethenaSharesInstance.unmint(5,'Maybe we have done a capital decrease or smth.',{from: Owner});
});

it('should not let anyone other than the owner of the contract unmint', async () => {
  await helpers.shouldRevert(AlethenaSharesInstance.unmint(5,'Maybe I just want to mess with the company.',{from: Tokenholder1}));
});

it('should let the contract owner set the claim parameters', async () => {
  console.log("Testing the setters for all parameters".green);
  const newCollateralRate = 5*10**18;
  const tx7 = await AlethenaSharesInstance.setClaimParameters(newCollateralRate, 50, {from: Owner});

  //Make sure change happened
  assert.equal(await AlethenaSharesInstance.collateralRate(),newCollateralRate);

  // there are no events to check
});

it('should not let anyone other than the owner set claim parameters', async () => {
  const newCollateralRate = 5*10**18;
  await helpers.shouldRevert(AlethenaSharesInstance.setClaimParameters(newCollateralRate, 50, {from: Shareholder1}));
});

it('should revert when claim parameters to be set are out of range', async () => {
  const newCollateralRate = 5*10**18;
  await helpers.shouldRevert(AlethenaSharesInstance.setClaimParameters(newCollateralRate, 20, {from: Owner}));
  await helpers.shouldRevert(AlethenaSharesInstance.setClaimParameters(0, 50, {from: Owner}));
});

it('should let the contract owner set the number of shares', async () => {
  const newTotalShareNumber = 1500;
  await AlethenaSharesInstance.setTotalShares(newTotalShareNumber, {from: Owner});

  //Make sure change happened
  assert.equal(await AlethenaSharesInstance.totalShares(),newTotalShareNumber);

  // there are no events to check
});

it('should revert when totalSupply exceeds no. of shares', async () => {
  await helpers.shouldRevert(AlethenaSharesInstance.setTotalShares(50, {from: Owner}));
});

// it('should only alow transfers of integer amounts of tokens', async () => {
//   await helpers.shouldRevert(AlethenaSharesInstance.transfer(Shareholder1,5.5,{from: Shareholder2}));
// });

it('should implement implement the approval function correctly', async () => {
  console.log('Testing standard ERC20 functionality'.green);
  const approvalBefore = await AlethenaSharesInstance.allowance(OtherAddress1,OtherAddress2);
  const tx9 = await AlethenaSharesInstance.approve(OtherAddress2,1,{from: OtherAddress1});
  const approvalAfter = await AlethenaSharesInstance.allowance(OtherAddress1,OtherAddress2);
  // Check approval happened
  assert.equal(approvalBefore.plus(1).toString(),approvalAfter.toString())

  // Check events:
  assert.equal(tx9.logs[0].event,'Approval');
  assert.equal(tx9.logs[0].args.approver,OtherAddress1);
  assert.equal(tx9.logs[0].args.spender,OtherAddress2);
  assert.equal(tx9.logs[0].args.value,1);
});

it('should implement implement the increaseApproval function correctly', async () => {
  const approvalBefore1 = await AlethenaSharesInstance.allowance(OtherAddress1,OtherAddress2);
  const tx10 = await AlethenaSharesInstance.increaseApproval(OtherAddress2,2,{from: OtherAddress1});
  const approvalAfter1 = await AlethenaSharesInstance.allowance(OtherAddress1,OtherAddress2);
  
  // Check approval happened
  assert.equal(approvalBefore1.plus(2).toString(),approvalAfter1.toString())

  // Check events:
  assert.equal(tx10.logs[0].event,'Approval');
  assert.equal(tx10.logs[0].args.approver,OtherAddress1);
  assert.equal(tx10.logs[0].args.spender,OtherAddress2);
  assert.equal(tx10.logs[0].args.value,3);
});

it('should implement implement the transferFrom function correctly', async () => {
  const beforeTransferFrom1 = await AlethenaSharesInstance.balanceOf(OtherAddress1);
  const beforeTransferFrom2 = await AlethenaSharesInstance.balanceOf(OtherAddress2);
  const beforeTransferFrom3 = await AlethenaSharesInstance.balanceOf(OtherAddress3);

  const tx12 = await AlethenaSharesInstance.transferFrom(OtherAddress1,OtherAddress3,1,{from: OtherAddress2});
  
  const afterTransferFrom1 = await AlethenaSharesInstance.balanceOf(OtherAddress1);
  const afterTransferFrom2 = await AlethenaSharesInstance.balanceOf(OtherAddress2);
  const afterTransferFrom3 = await AlethenaSharesInstance.balanceOf(OtherAddress3);

  // Check transfer happened
  assert.equal(beforeTransferFrom1.minus(1).toString(), afterTransferFrom1);
  assert.equal(beforeTransferFrom2.toString(), afterTransferFrom2);
  assert.equal(beforeTransferFrom3.plus(1).toString(), afterTransferFrom3);

  // Check events:
  assert.equal(tx12.logs[0].event,'Transfer');
  assert.equal(tx12.logs[0].args.from,OtherAddress1);
  assert.equal(tx12.logs[0].args.to,OtherAddress3);
  assert.equal(tx12.logs[0].args.value,1);
});

it('should only let the owner execute the pause function', async () => {
  console.log("Check that pause works".green);
  await helpers.shouldRevert(AlethenaSharesInstance.pause(true, 'Let me just pause here...',{from: Tokenholder2}));
});

it('pause the contract', async () => {
  const pauseMessage = 'Keep calm and carry on with new contract xyz';
  const tx8 = await AlethenaSharesInstance.pause(true, pauseMessage,{from: Owner});

  //Check events:
  assert.equal(tx8.logs[0].event,'Pause');
  assert.equal(tx8.logs[0].args.paused,true);
  assert.equal(tx8.logs[0].args.message,pauseMessage);
});

it('should revert on user actions if contract is paused', async () => {
  // Call all functions here and make sure they work without pause
  await helpers.shouldRevert(AlethenaSharesInstance.transferFrom(OtherAddress1,OtherAddress3,1,{from: OtherAddress2}));
  await helpers.shouldRevert(AlethenaSharesInstance.approve(OtherAddress2,1,{from: OtherAddress1}));
  await helpers.shouldRevert(AlethenaSharesInstance.increaseApproval(OtherAddress2,2,{from: OtherAddress1}));
  await helpers.shouldRevert(AlethenaSharesInstance.transfer(OtherAddress2,1,{from: OtherAddress1}));
});

it('unpause the contract', async () => {
  const unpauseMessage = 'Keep calm and carry on with this contract';
  const tx11 = await AlethenaSharesInstance.pause(false, unpauseMessage,{from: Owner});

  //Check events:
  assert.equal(tx11.logs[0].event,'Pause');
  assert.equal(tx11.logs[0].args.paused,false);
  assert.equal(tx11.logs[0].args.message,unpauseMessage);
});


});