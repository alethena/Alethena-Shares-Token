//import expectThrow from './tools';
'use-strict'
const AlethenaShares = artifacts.require('./AlethenaShares.sol');



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

  it('should mint correctly', async () => {
    console.log("Check the minting function(s)".green);

    const tx1 = await AlethenaSharesInstance.mint(Owner,mintOwner,'Testing mint');
    const tx2 = await AlethenaSharesInstance.mintMany(
      [Shareholder1, Shareholder2, Shareholder3],
      [mintShareholder1, mintShareholder2, mintShareholder3],
      'Testing batch mint');

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
    assert.equal(tx2.logs[0].args.message,'Testing batch mint');

    assert.equal(tx2.logs[1].event,'Mint');
    assert.equal(tx2.logs[1].args.shareholder,Shareholder2);
    assert.equal(tx2.logs[1].args.amount,mintShareholder2);
    assert.equal(tx2.logs[1].args.message,'Testing batch mint');

    assert.equal(tx2.logs[2].event,'Mint');
    assert.equal(tx2.logs[2].args.shareholder,Shareholder3);
    assert.equal(tx2.logs[2].args.amount,mintShareholder3);
    assert.equal(tx2.logs[2].args.message,'Testing batch mint');

});
  
it('should only alow owner to mint', async () => {
  await shouldRevert(AlethenaSharesInstance.mint(Owner,mintOwner,'Testing mint',{from: Shareholder1}));
});

it('should only alow owner to batch mint', async () => {
  await shouldRevert(AlethenaSharesInstance.mintMany(
      [Shareholder1, Shareholder2, Shareholder3],
      [mintShareholder1, mintShareholder2, mintShareholder3],
      'Testing batch mint',{from: Shareholder1}));
});

it('should check for array lengths in batch mint', async () => {
  await shouldRevert(AlethenaSharesInstance.mintMany(
      [Shareholder1, Shareholder2, Shareholder3],
      [mintShareholder1, mintShareholder2],
      'Testing batch mint',{from: Owner}));
});

it('should let OtherAddress1 make a claim on Shareholder1', async () => {
  console.log("Case 1: Legitimate claim is made and resolved after waiting period".green);

  const Shareholder1Balance = await AlethenaSharesInstance.balanceOf(Shareholder1);
  const Collateral1 = Shareholder1Balance*10**18;
  const tx3 = await AlethenaSharesInstance.declareLost(Shareholder1,{from: OtherAddress1, value: Collateral1});
  let blockstamp = web3.eth.getBlock('latest').timestamp;

  //Check that data in struct is correct
  assert.equal(OtherAddress1,await AlethenaSharesInstance.getClaimant(Shareholder1));
  assert.equal(Collateral1,await AlethenaSharesInstance.getCollateral(Shareholder1));
  assert.equal(blockstamp,await AlethenaSharesInstance.getTimeStamp(Shareholder1)); 

  //Test events
  assert.equal(Shareholder1, tx3.logs[0].args._lostAddress, 'Lost address is incorrect');
  assert.equal(OtherAddress1, tx3.logs[0].args._claimant, 'Claimant address is incorrect');

});

it('should reject clearing the claim on Shareholder1 before the waiting period is over', async () => {
  await shouldRevert(AlethenaSharesInstance.resolveClaim(Shareholder1,{from: OtherAddress1}));
});

it('Increase time', async () => {
  await increaseTime(1000*60*60*24*300);
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

it("should revert if a claim doesn't have enough funding", async () => {
  await shouldRevert(AlethenaSharesInstance.declareLost(Shareholder2,{from: OtherAddress1, value: 10*10**18}));
});

it("should revert if target address has zero balance", async () => {
  await shouldRevert(AlethenaSharesInstance.declareLost(Tokenholder3,{from: OtherAddress1, value: 10*10**18}));
});


it('should let OtherAddress2 make a claim on Shareholder2', async () => {
  console.log("Case 2: Malicious or accidental claim is made but cleared by a transaction".green);
  ShareHolder2Balance = await AlethenaSharesInstance.balanceOf(Shareholder2);
  Collateral2 = ShareHolder2Balance*10**18
  const tx4 = await AlethenaSharesInstance.declareLost(Shareholder2,{from: OtherAddress2, value: Collateral2});
  blockstamp =  web3.eth.getBlock('latest').timestamp;

  //Check that data in struct is correct
  assert.equal(OtherAddress2,await AlethenaSharesInstance.getClaimant(Shareholder2));
  assert.equal(Collateral2,await AlethenaSharesInstance.getCollateral(Shareholder2));
  assert.equal(blockstamp,await AlethenaSharesInstance.getTimeStamp(Shareholder2)); 
});

it("should revert claim on Shareholder2 because target address is already claimed", async () => {
  await shouldRevert(AlethenaSharesInstance.declareLost(Shareholder2,{from: OtherAddress3, value: 10*10**18}));
});

it('should clear claim on OtherAddress2 after a transaction', async () => {
  var tx5 = await AlethenaSharesInstance.transfer(Tokenholder2,5,{from: Shareholder2});
  
  //Check that struct was deleted
  assert.equal('0x0000000000000000000000000000000000000000',await AlethenaSharesInstance.getClaimant(Shareholder2));
  assert.equal(0,await AlethenaSharesInstance.getCollateral(Shareholder2));
  assert.equal(0,await AlethenaSharesInstance.getTimeStamp(Shareholder2)); 
});

it('should let OtherAddress3 make a claim on Shareholder3', async () => {
  console.log("Case 3: A claim is made but deleted by the owner of the contract".green);
  let ShareHolder3Balance = await AlethenaSharesInstance.balanceOf(Shareholder3);
  Collateral3 = ShareHolder3Balance*10**18
  await AlethenaSharesInstance.declareLost(Shareholder3,{from: OtherAddress3, value: Collateral3});
  blockstamp =  web3.eth.getBlock('latest').timestamp;

  //Check that data in struct is correct
  assert.equal(OtherAddress3,await AlethenaSharesInstance.getClaimant(Shareholder3));
  assert.equal(Collateral3,await AlethenaSharesInstance.getCollateral(Shareholder3));
  assert.equal(blockstamp,await AlethenaSharesInstance.getTimeStamp(Shareholder3)); 
});

it('should revert when anyone other than the owner calls deleteClaim', async () => {
  await shouldRevert(AlethenaSharesInstance.deleteClaim(Shareholder3,{from: Shareholder1}));
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

it('should let OtherAddress3 make a claim again on Shareholder3', async () => {
  console.log("Case 4: A claim is made but cleared by owner of claimed address".green);
  ShareHolder3Balance = await AlethenaSharesInstance.balanceOf(Shareholder3);
  Collateral3 = ShareHolder3Balance*10**18
  await AlethenaSharesInstance.declareLost(Shareholder3,{from: OtherAddress3, value: Collateral3});
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
  await shouldRevert(AlethenaSharesInstance.unmint(5,'Maybe I just want to mess with the company.',{from: Tokenholder1}));
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
  await shouldRevert(AlethenaSharesInstance.setClaimParameters(newCollateralRate, 50, {from: Shareholder1}));
});

it('should revert when claim parameters to be set are out of range', async () => {
  const newCollateralRate = 5*10**18;
  await shouldRevert(AlethenaSharesInstance.setClaimParameters(newCollateralRate, 20, {from: Owner}));
  await shouldRevert(AlethenaSharesInstance.setClaimParameters(0, 50, {from: Owner}));
});

it('should let the contract owner set the number of shares', async () => {
  const newTotalShareNumber = 1500;
  await AlethenaSharesInstance.setTotalShares(newTotalShareNumber, {from: Owner});

  //Make sure change happened
  assert.equal(await AlethenaSharesInstance.totalShares(),newTotalShareNumber);

  // there are no events to check
});

it('should revert when totalSupply exceeds no. of shares', async () => {
  await shouldRevert(AlethenaSharesInstance.setTotalShares(50, {from: Owner}));
});



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
  await shouldRevert(AlethenaSharesInstance.pause(true, 'Let me just pause here...',{from: Tokenholder2}));
});

it('pause the contract', async () => {
  const pauseMessage = 'Keep calm and carry on with new contract xyz';
  const tx8 = await AlethenaSharesInstance.pause(true, pauseMessage,{from: Owner});

  //Check events:
  assert.equal(tx8.logs[0].event,'Pause');
  assert.equal(tx8.logs[0].args.paused,true);
  assert.equal(tx8.logs[0].args.message,pauseMessage);
});

// Call all functions here and make sure they work without pause
it('should revert on user actions if contract is paused', async () => {
  await shouldRevert(AlethenaSharesInstance.transferFrom(OtherAddress1,OtherAddress3,1,{from: OtherAddress2}));
  await shouldRevert(AlethenaSharesInstance.approve(OtherAddress2,1,{from: OtherAddress1}));
  await shouldRevert(AlethenaSharesInstance.increaseApproval(OtherAddress2,2,{from: OtherAddress1}));
  await shouldRevert(AlethenaSharesInstance.transfer(OtherAddress2,1,{from: OtherAddress1}));
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

// HELPER FUNCTIONS. Should be put in a separate file at some point.

//Used to increase time in simulated EVM
async function increaseTime (duration) {
  const id = Date.now();

  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: [duration],
      id: id,
    }, err1 => {
      if (err1) return reject(err1);

      web3.currentProvider.sendAsync({
        jsonrpc: '2.0',
        method: 'evm_mine',
        id: id + 1,
      }, (err2, res) => {
        return err2 ? reject(err2) : resolve(res);
      });
    });
  });
}

//Used to check that EVM reverts when we expect it
async function shouldRevert(promise) {
  try {
      await promise;
  } catch (error) {
      const revert = error.message.search('revert') >= 0;
      assert(
          revert,
          'Expected throw, got \'' + error + '\' instead',
      );
      return;
  }
  assert.fail('Expected throw not received');
}