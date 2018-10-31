const Web3 = require("web3");
const fs = require("fs");
let settings = require("../truffle.js");
secret = require("../secret.json");

const compiledContract = require('../build/contracts/AlethenaShares.json');
const abi = compiledContract.abi;
const bytecode = compiledContract.bytecode; 

const providerURL = 'http://127.0.0.1:8545';

web3 = new Web3(new Web3.providers.HttpProvider(providerURL));

async function main(){
    try{
    await web3.eth.personal.unlockAccount(secret.account, secret.password, 10,(err,res) => {
        if (!err){console.log('Account unlocked')};
    });
  
    let gasEstimate = await web3.eth.estimateGas({data: bytecode});
    let gasPrice = await web3.eth.getGasPrice();
    console.log("The gas estimate is: " + gasEstimate)
    console.log("This will cost you roughly: " + gasEstimate*gasPrice/10**18 + " Ether");
    
        let MyContract = await new web3.eth.Contract(abi);
        web3.eth.sendTransaction({data: bytecode, gas: gasEstimate, from: secret.account}).on('transactionHash', function(hash){
            console.log(hash);
        })
        .on('receipt', function(receipt){
            console.log(receipt);
        })
        .on('error', console.error); // If a out of gas error, the second parameter is the receipt.;
    }
    catch(err){
        console.log(err);
    }
}

main();
