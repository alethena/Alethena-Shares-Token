pragma solidity ^0.4.24;

import "./Assert.sol";
//import "truffle/DeployedAddresses.sol";
import "../contracts/AlethenaShares.sol";

contract AlethenaSharesTest {

    event TestEvent(string message);

    function testShares() public returns (bool){
        //AlethenaShares registry = AlethenaShares(msg.sender);
        //assert(registry.balanceOf(msg.sender) == 0);
        emit TestEvent("Juhuu");
        assert (1==1);
        return true;
    }

}