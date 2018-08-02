pragma solidity ^0.4.24;

import "./Ownable.sol";
import "./ERC20Basic.sol";

/**
 * @title Claimable
 * In case of tokens that represent real-world assets such as shares of a company, one needs a way
 * to handle lost private keys. With physical certificates, courts can declare share certificates as
 * invalid so the company can issue replacements. Here, we want a solution that does not depend on 
 * third parties to resolve such cases. Instead, when someone has lost a private key, he can use the
 * declareLost function to post a deposit and claim that the shares assigned to a specific address are
 * lost. If he actually is the owner of the shares, he needs to wait for a certain period and can then
 * reclaim the lost shares as well as the deposit. If he is an attacker trying to claim shares belonging
 * to someone else, he risks losing the deposit as it can be claimed at anytime by the rightful owner.
 * Furthermore, the company itself can delete claims at any time and take the deposit. So in order to
 * use this functionality, one needs to trust the company to do the right thing and to handle potential
 * disputes responsibly. If you do not trust the company to do so, don't lose your private keys. :)
 */
contract Claimable is ERC20Basic, Ownable {

    struct Claim {
        address claimant; // the person who created the claim
        uint256 collateral; // the amount of wei deposited
        uint timestamp;  // the block in which the claim was made
    }

    /** @param collateralRate Sets the collateral needed per share to file a claim */
    uint128 collateralRate = 1 ether;
    uint32 claimPeriod = 1; // 6000*180;
    mapping(address => Claim) public claims; // there can be at most one claim per address

    function setClaimParameters(uint128 _collateralRate, uint32 _claimPeriodInBlocks) public onlyOwner() {
        require(_collateralRate > 0);
        require(_claimPeriodInBlocks > 30*6000); // must be at least 30 days
        collateralRate = _collateralRate;
        claimPeriod = _claimPeriodInBlocks;
    }

    event ClaimMade(address indexed _lostAddress, address indexed _claimant, uint256 _balance);
    event ClaimCleared(address indexed _lostAddress, uint256 collateral);
    event ClaimDeleted(address indexed _lostAddress, address indexed _claimant, uint256 collateral);
    event ClaimResolved(address indexed _lostAddress, address indexed _claimant, uint256 collateral);
  
  /** Anyone can declare that the private key to a certain address was lost by calling declareLost
    * providing a deposit/collateral. There are three possibilities of what can happen with the claim:
    * 1) The claim period expires and the claimant can get the deposit and the shares back by calling resolveClaim
    * 2) The "lost" private key is used at any time to call resolveClaim. In that case, the claim is deleted and
    *    the deposit sent to the shareholder (the owner of the private key). It is recommended to call resolveClaim
    *    whenever someone transfers funds to let claims be resolved automatically when the "lost" private key is
    *    used again.
    * 3) The owner deletes the claim and assigns the deposit to himself. This is intended to be used to resolve
    *    disputes. Who is entitled to keep the deposit depends on the contractual agreements between the involved
    *    parties and in particular the issuance terms. Generally, using this function implies that you have to trust
    *    the issuer of the tokens to handle the situation well. As a rule of thumb, the contract owner should assume
    *    the owner of the lost address to be the rightful owner of the deposit. 
    * It is highly recommended that the owner observes the claims made and informs the owners of the claimed addresses
    * whenever a claim is made for their address (this of course is only possible if they are known to the owner, e.g.
    * through a shareholder register).
    */
    function declareLost(address _lostAddress) public payable{
        uint256 balance = balanceOf(_lostAddress);
        require(balance > 0);
        require(msg.value >= balance*collateralRate);
        require(claims[_lostAddress].collateral == 0);
        claims[_lostAddress] = Claim({
            claimant: msg.sender,
            collateral: msg.value,
            timestamp: block.number
        });
        emit ClaimMade(_lostAddress, msg.sender, balance);
    }

    /**
     * Clears a claim after the key has been found again and assigns the collateral to the "lost" address.
     */
    function clearClaim() public returns (uint256){
        uint256 collateral = claims[msg.sender].collateral;
        if (collateral != 0){
            delete claims[msg.sender];
            msg.sender.transfer(collateral);
            emit ClaimCleared(msg.sender, collateral);
            return collateral;
        } else {
            return 0;
        }
    }
    
   /** 
    * @dev This function is used to resolve a claim.
    * @dev A rightful owner can claim his address back.
    * @dev Else, after waiting period address can be claimed.
    * 
   */
    function resolveClaim(address _lostAddress) public returns (uint256){
        Claim memory claim = claims[_lostAddress];
        require(claim.collateral != 0, "No claim found");
        require(claim.claimant == msg.sender);
        require(claim.timestamp + claimPeriod >= block.number);

        address claimant = claim.claimant;
        delete claims[_lostAddress];
        claimant.transfer(claim.collateral);
        internalTransfer(_lostAddress, claimant, balanceOf(_lostAddress));
        emit ClaimResolved(_lostAddress, claimant, claim.collateral);
        return claim.collateral;
    }

    function internalTransfer(address _from, address _to, uint256 _value) internal;

     /** @dev This function is to be executed by the owner only in case a dispute needs to be resolved manually. */
    function deleteClaim(address _lostAddress) public onlyOwner(){
        Claim memory claim = claims[_lostAddress];
        require(claim.collateral != 0, "No claim found");
        delete claims[_lostAddress];
        owner.transfer(claim.collateral);
        emit ClaimDeleted(_lostAddress, claim.claimant, claim.collateral);
    }

}