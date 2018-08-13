//import expectThrow from './tools';

const AlethenaShares = artifacts.require('./AlethenaShares.sol');



contract('AlethenaShares', (accounts) => {

  // Define the relevant players for the test
  const Owner             = accounts[0];
  const Shareholder1      = accounts[1];
  const Shareholder2      = accounts[2]; 
  const Shareholder3      = accounts[3];
  const Tokenholder1      = accounts[4];
  const Tokenholder2      = accounts[5];
  const Tokenholder3      = accounts[6];
  const OtherAdress1      = accounts[7];
  const OtherAdress2      = accounts[8];
  const OtherAdress3      = accounts[9];



  const mintOwner        = 100;
  const mintShareholder1 = 10;
  const mintShareholder2 = 20;
  const mintShareholder3 = 30;
  const mintTokenholder1 = 10;
  const mintTokenholder2 = 20;
  const mintTokenholder3 = 30;


  // Get an instance of the token
  let AlethenaSharesInstance;
  before(async () => {
      AlethenaSharesInstance = await AlethenaShares.deployed();
  });

  it('should set basic info correctly', async () => {
    const name                  = await AlethenaSharesInstance.name();
    const symbol                = await AlethenaSharesInstance.symbol();
    const decimals              = await AlethenaSharesInstance.decimals();

    assert.equal(name, 'Alethena Shares', 'Name incorrect');
    assert.equal(symbol, 'ATH', 'Symbol incorrect');
    assert.equal(decimals, 0, 'Decimals incorrect');
});

  it('should have zero token balances initially', async () => {
    var OwnerBalance = await AlethenaSharesInstance.balanceOf(Owner);  
    var FirstBalance = await AlethenaSharesInstance.balanceOf(Shareholder1); 
    var SecondBalance = await AlethenaSharesInstance.balanceOf(Shareholder2);   
    assert.equal(OwnerBalance, 0, 'Not minted correctly');
    assert.equal(FirstBalance, 0, 'Not minted correctly');
    assert.equal(SecondBalance, 0, 'Not minted correctly');

});

  it('should mint correctly', async () => {
    const tx1 = await AlethenaSharesInstance.mint(Owner,mintOwner,'Testing mint');
    const tx2 = await AlethenaSharesInstance.mintMany(
      [Shareholder1, Shareholder2, Shareholder3, Tokenholder1, Tokenholder2, Tokenholder3],
      [mintShareholder1, mintShareholder2, mintShareholder3, mintTokenholder1, mintTokenholder2, mintTokenholder3],
      'Testing batch mint');

    OwnerBalance = await AlethenaSharesInstance.balanceOf(Owner);  
    FirstBalance = await AlethenaSharesInstance.balanceOf(Shareholder1); 
    SecondBalance = await AlethenaSharesInstance.balanceOf(Shareholder2);   
    assert.equal(OwnerBalance, mintOwner, 'Not minted correctly');
    assert.equal(FirstBalance, mintShareholder1, 'Not minted correctly');
    assert.equal(SecondBalance, mintShareholder2, 'Not minted correctly');
    //console.log(tx1.logs);
    //console.log(tx2.logs);
});
  
it('should only alow owner to mint', async () => {
  var throws = false;
  try{
    await AlethenaSharesInstance.mintMany(
      [Shareholder1, Shareholder2, Shareholder3, Tokenholder1, Tokenholder2, Tokenholder3],
      [mintShareholder1, mintShareholder2, mintShareholder3, mintTokenholder1, mintTokenholder2, mintTokenholder3],
      'Testing batch mint',{from: Shareholder1});
} 
  catch(e){throws = true}
  assert.isTrue(throws)
});

it('should only alow owner to batch mint', async () => {
  var throws = false;
  try{await AlethenaSharesInstance.mint(Owner,mintOwner,'Testing mint',{from: Shareholder1});} 
  catch(e){throws = true}
  assert.isTrue(throws)
  });

  
it('should let any address make a claim', async () => {
  const tx3 = await AlethenaSharesInstance.declareLost(Shareholder1,{from: OtherAdress1, value: 10**19});
  log3 = tx3.logs[0];
  assert.equal(Shareholder1, log3.args._lostAddress, 'Lost adress is incorrect');
  assert.equal(OtherAdress1, log3.args._claimant, 'Claimant address is incorrect');
  //assert.equal(web3.toBigNumber(10), log3.args._balance, 'Balance is incorrect');
});

it("should revert if a claim doesn't have enough funding", async () => {
  assert(shouldRevert(AlethenaSharesInstance.declareLost(Shareholder2,{from: OtherAdress1, value: 25*10**18})),'Verkackt');
});
  

});


async function shouldRevert(promise) {
try{
  await promise;
}
catch(error){
  const revert = error.message.search('revert') > 0;
  return revert;
  } 
  return false;
}
