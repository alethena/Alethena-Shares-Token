pragma solidity ^0.4.24;

import "./ERC20Basic.sol";
import "./SafeMath.sol";
import "./ERC20.sol";
import "./Ownable.sol";


/**
 * @title Alethena Shares
 * @author Benjamin Rickenbacher, benjamin@alethena.com
 * @author Luzius Meisser, luzius@meissereconomics.com
 * @dev These tokens are based on the ERC20 standard and the open-zeppelin library.
 *
 * These tokens are uncertified alethena shares (Wertrechte according to the Swiss code of obligations),
 * with this smart contract serving as onwership registry (Wertrechtebuch), but not as shareholder
 * registry, which is kept separate and run by the company. This is equivalent to the traditional system
 * of having physical share certificates kept at home by the shareholders and a shareholder registry run by
 * the company. Just like with physical certificates, the owners of the tokens are the owners of the shares.
 * However, in order to exercise their rights (for example receive a dividend), shareholders must register
 * with the company. For example, in case the company pays out a dividend to a previous shareholder because
 * the current shareholder did not register, the company cannot be held liable for paying the dividend to
 * the "wrong" shareholder. In relation to the company, only the registered shareholders count as such.
 * Registration requires setting up an account with ledgy.com providing your name and address and proving
 * ownership over your addresses.
 * @notice The main addition is a functionality that allows the user to claim that the key for a certain address is lost.
 * @notice In order to prevent malicious attempts, a collateral needs to be posted.
 * @notice The contract owner can delete claims in case of disputes.
 *
 * https://github.com/ethereum/EIPs/issues/20
 * Based on code by FirstBlood: https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol
 */
contract AlethenaShares is ERC20, Ownable {

    using SafeMath for uint256;

    mapping(address => uint256) balances;
    uint256 totalSupply_;        // total number of tokenized shares, sum of all balances
    uint256 totalShares_ = 1000; // total number of outstanding shares, maybe not all tokenized

    event Mint(address shareholder, uint256 currentTokens, uint256 currentShares, string message);
    event Unmint(uint256 currentTokens, uint256 currentShares, string message);

  /** @dev Total number of tokens in existence */
  
    function totalSupply() public view returns (uint256) {
        return totalSupply_;
    }
        
  /** @dev Total number of shares in existence, not necessarily all represented by a token. 
    * @dev This could be useful to calculate the total market cap.
    */
    function totalShares() public view returns (uint256) {
        return totalShares_;
    }

  /** @dev Increases the number of the tokenized shares. If the shares are newly issued, the share total also needs to be increased. */
    function mint(address shareholder, uint256 _newMaxSupply, uint256 _newTotalShares, string _message) public onlyOwner() {
        require(_newMaxSupply <= _newTotalShares);
        require(_newMaxSupply >= maxSupply_);
        uint256 minted = _maxSupply - _newMaxSupply;
        balances[shareholder] = balances[shareholder].add(minted);
        maxSupply_ = _newMaxSupply;
        totalShares_ = _newTotalShares;
        emit Mint(shareholder, maxSupply_, totalShares_, _message);
    }

/** Decrease the number of the tokenized shares. There are two use-cases for this function:
 *  1) a capital decrease with a destruction of the shares, in which case the law requires that the
 *     destroyed shares are currently owned by the company.
 *  2) a shareholder wants to take shares offline. This can only happen with the agreement of the 
 *     the company. To do so, the shares must be transferred to the company first, the company call
 *     this function without adjusting totalShares and then assigning the untokenized shares back
 *     to the shareholder in whatever way the new form (e.g. printed certificate) of the shares
 *     require.
 */
    function unmint(uint256 _newMaxSupply, uint256 _newTotalShares, string _message) public onlyOwner() {
        require(_newMaxSupply <= _newTotalShares);
        require(_newMaxSupply < maxSupply_);
        // company-owned shares are being destroyed
        uint256 destroyed = _maxSupply - _newMaxSupply;
        require(destroyed <= balanceOf(owner));
        balances[owner] = balances[owner].sub(destroyed);
        maxSupply_ = _newMaxSupply;
        totalShares_ = _newTotalShares;
        emit Unmint(maxSupply_, totalShares_, _message);
    }

  /** @param collateralRate Sets the "exchange rate" for declaring addresses lost */

    uint256 collateralRate = 10**18 wei;
    event CollateralRateChanged();

    function setCollateralRate(uint256 _collateralRate) public onlyOwner() {
        collateralRate = _collateralRate;
        emit CollateralRateChanged();
    }

  /** This contract is pausible.  */
    bool public isPaused = false;

  /** @dev Give URL where the legal documents supporting the token can be found.
      Does this need to be hashed??? */
    string public TermsAndConditions = "www.alethena.com";

    function setTC(string _TermsAndConditions) public onlyOwner() returns (bool){
        TermsAndConditions = _TermsAndConditions;
        emit TCChanged();
    }

   
  /** @dev Function to set pause.  */
    function pause(string _message) public onlyOwner() returns (bool) {
        isPaused = true;
        emit Pause(_message);
        return true;
    }

/** 
* @dev Function to unpause.  
*/
    function unpause() public onlyOwner() returns (bool) {
        isPaused = false;
        emit Unpause();
        return true;
    }

    event Pause(string message);
    event Unpause();
    event TCChanged();

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** 
The next section contains standard ERC20 routines.
Main change: Transfer functions have an additional post function which resolves claims if applicable.
 */
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
  * @dev Transfer token for a specified address
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  */
    function transfer(address _to, uint256 _value) public returns (bool) {
        require(!isPaused);
        require(_to != address(0));
        require(_value <= balances[msg.sender]);
        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        resolveClaim(msg.sender);
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

  /**
  * @dev Gets the balance of the specified address.
  * @param _owner The address to query the the balance of.
  * @return An uint256 representing the amount owned by the passed address.
  */
    function balanceOf(address _owner) public view returns (uint256) {
        return balances[_owner];
    }


    mapping (address => mapping (address => uint256)) internal allowed;


  /**
   * @dev Transfer tokens from one address to another
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
   */
    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    )
        public
        returns (bool)
    {
        require(!isPaused);
        require(_to != address(0));
        require(_value <= balances[_from]);
        require(_value <= allowed[_from][msg.sender]);

        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
        resolveClaim(msg.sender);
        emit Transfer(_from, _to, _value);
        return true;
    }

  /**
   * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
   * Beware that changing an allowance with this method brings the risk that someone may use both the old
   * and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this
   * race condition is to first reduce the spender's allowance to 0 and set the desired value afterwards:
   * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
   * @param _spender The address which will spend the funds.
   * @param _value The amount of tokens to be spent.
   */
    function approve(address _spender, uint256 _value) public returns (bool) {
        require(!isPaused);
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

  /**
   * @dev Function to check the amount of tokens that an owner allowed to a spender.
   * @param _owner address The address which owns the funds.
   * @param _spender address The address which will spend the funds.
   * @return A uint256 specifying the amount of tokens still available for the spender.
   */
    function allowance(
        address _owner,
        address _spender
    )
    public
    view
    returns (uint256)
  {
        return allowed[_owner][_spender];
    }

  /**
   * @dev Increase the amount of tokens that an owner allowed to a spender.
   * approve should be called when allowed[_spender] == 0. To increment
   * allowed value is better to use this function to avoid 2 calls (and wait until
   * the first transaction is mined)
   * From MonolithDAO Token.sol
   * @param _spender The address which will spend the funds.
   * @param _addedValue The amount of tokens to increase the allowance by.
   */
    function increaseApproval(
        address _spender,
        uint256 _addedValue
    )
        public
        returns (bool)
    {
        require(!isPaused);
        allowed[msg.sender][_spender] = (
        allowed[msg.sender][_spender].add(_addedValue));
        emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;
    }

  /**
   * @dev Decrease the amount of tokens that an owner allowed to a spender.
   * approve should be called when allowed[_spender] == 0. To decrement
   * allowed value is better to use this function to avoid 2 calls (and wait until
   * the first transaction is mined)
   * From MonolithDAO Token.sol
   * @param _spender The address which will spend the funds.
   * @param _subtractedValue The amount of tokens to decrease the allowance by.
   */
    function decreaseApproval(
        address _spender,
        uint256 _subtractedValue
    )
        public
        returns (bool)
    {
        require(!isPaused);
        uint256 oldValue = allowed[msg.sender][_spender];
        if (_subtractedValue > oldValue) {
            allowed[msg.sender][_spender] = 0;
        } else {
            allowed[msg.sender][_spender] = oldValue.sub(_subtractedValue);
        }
        emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;
    }
  
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
     
    struct Claim {
        address owner; // the person who created the claim
        uint256 collateral; // the amount of wei deposited
        uint timestamp;  // the block in which the claim was created
    }

    event ClaimMade(address indexed _lostAddress, address indexed _claimer, uint256 _lockTime);
    event ClaimDeleted(address indexed _lostAddress, address indexed _claimer);

  /** 
    * @dev Getters for claims. Since keys cannot be deleted, they will be shown by showAllClaims() even if the claim was deleted.
    * @dev To check specific claim use showClaim()
    */

    function showClaim(address _claimedAddress, address _claimerAddress) public view returns (uint256){
        return claims[_claimedAddress][_claimerAddress];
    }

    function showAllClaims(address _claimedAddress) public view returns (address[]){
        return indices[_claimedAddress];
    }

    function showCollaterals(address _claimedAddress) public view returns (uint256){
        return collaterals[_claimedAddress];
    }

   
  
  /** @dev Anyone can declare that the private key to a certain address was lost by 
    * @dev calling declareLost and passing the address in question. To prevent random requests
    * @dev a high collateral needs to be posted.
    * @dev Using block timestamps is ok as we will replace 1 minute by something like 1 year.
    */
    function declareLost (address _lostAddress) public payable returns (bool){
        require(!isPaused);
        require(msg.value == balances[_lostAddress]*collateralRate);
        claims[_lostAddress][msg.sender] = block.timestamp + 1 minutes;
        indices[_lostAddress].push(msg.sender);
        collaterals[_lostAddress] = collaterals[_lostAddress].add(msg.value);
        emit ClaimMade(_lostAddress, msg.sender, claims[_lostAddress][msg.sender]);
    }
    
   /** 
    * @dev This function is used to resolve a claim.
    * @dev A rightful owner can claim his address back.
    * @dev Else, after waiting period address can be claimed.
    * 
   */
    function resolveClaim(address _addressToBeResolved) public returns (bool){
        require(!isPaused);
        if (msg.sender == _addressToBeResolved){
            //pay out collateral
            msg.sender.transfer(collaterals[_addressToBeResolved]);
            //DELETE ALL CLAIMS FIR THIS ADDRESS
            deleteAllClaims(_addressToBeResolved);
            return true;
        }

        else{
            // Check the sender actually has a claim
            require(claims[_addressToBeResolved][msg.sender] != 0);

            // Check that locking period fpr the sender is over
            require(claims[_addressToBeResolved][msg.sender] < block.timestamp);

           //pay claimer
            msg.sender.transfer(collaterals[_addressToBeResolved]);
            
           //...and give him the tokens         
            balances[msg.sender] = balances[msg.sender].add(balances[_addressToBeResolved]);
            balances[_addressToBeResolved] = 0;
            emit Transfer(_addressToBeResolved, msg.sender, balances[_addressToBeResolved]);
        
          //DELETE ALL CLAIMS FOR THIS ADDRESS
            deleteAllClaims(_addressToBeResolved);
            return true;
        }
        return false;
    }


     /** @dev This function is to be executed by the owener only in case a legal dispute needs to be settled */
     
    function deleteClaim(address _lostAddress, address _claimerAddress) public onlyOwner() returns (bool){
        claims[_lostAddress][_claimerAddress] = 0;
        emit ClaimDeleted(_lostAddress, _claimerAddress);
        return true;
    }

      /** @dev This function is used to remove all claims on an address after claims have been resolved. */

    function deleteAllClaims(address _lostAddress) private returns (bool){

        uint arrayLength = indices[_lostAddress].length;
        for (uint i = 0; i < arrayLength; i++){
            claims[_lostAddress][indices[_lostAddress][i]] = 0;
            emit ClaimDeleted(_lostAddress, indices[_lostAddress][i]);
        }
        collaterals[_lostAddress] = 0;

        return true;
    }

}