pragma solidity ^0.4.24;

import "./ERC20Basic.sol";
import "./SafeMath.sol";
import "./ERC20.sol";
import "./Ownable.sol";


/**
 * @title Standard ERC20 token
 * @author Benjamin Rickenbacher, benjamin@alethena.com
 * @dev This is the "instruction token" based on the ERC20 standard and the open zeppelin library.
 * @dev The main addition is a functionality that allows the user to claim that the key for a certain address is lost.
 * @dev In order to prevent malicious attempts, a collateral needs to be posted.
 * @dev The contract owner can delete claims in case of disputes.
 * 
 * https://github.com/ethereum/EIPs/issues/20
 * Based on code by FirstBlood: https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol
 */
contract InstructionToken is ERC20, Ownable {

    using SafeMath for uint256;

    mapping(address => uint256) balances;

    uint256 totalSupply_;

  // @param collateralRate Sets the "exchange rate" for declaring addresses lost   
    
    uint256 collateralRate = 1 ether;

  /** This contract is pausible.  */

    bool public isPaused = false;
    bytes32 public pauseMessage = "Contract is active";
    event Pause();
    event Unpause();

  /** @dev Function to set pause.  */

    function pause(bytes32 _inputMessage) public onlyOwner() returns (bool) {
        isPaused = true;
        pauseMessage = _inputMessage;
        emit Pause();
        return true;
    }

    function unpause() public onlyOwner() returns (bool) {
        isPaused = false;
        pauseMessage = "Contract is active";
        emit Unpause();
        return true;
    }

  /**
  * @dev Total number of tokens in existence
  */
    function totalSupply() public view returns (uint256) {
        return totalSupply_;
    }

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
  
  ////////////////////////////////////
  
    function mint(address _receiver, uint _amount) public onlyOwner() returns (bool){
        require(!isPaused);
        balances[_receiver] = balances[_receiver].add(_amount);
        return true;
    }
  
     
  /** First address is for the address that is being claimed.
      Second address is the  user who makes the claim 
      The uint stores the locking period for a specific address pair */

    mapping(address => mapping(address => uint256)) claims; 
    mapping(address => address[]) indices;

    event ClaimMade(address indexed _lostAddress, address indexed _claimer, uint256 _lockTime);
    event ClaimDeleted(address indexed _lostAddress, address indexed _claimer);

    function showClaim(address _claimedAddress, address _claimerAddress) public view returns (uint256){
        return claims[_claimedAddress][_claimerAddress];
    }

    function showAllClaims(address _claimedAddress) public view returns (address[]){
        return indices[_claimedAddress];
    }

    function showCollaterals(address _claimedAddress) public view returns (uint256){
        return collaterals[_claimedAddress];
    }

   // This stores the total collateral for a certain target address
    mapping(address => uint256) collaterals;
  
  /** @dev Anyone can declare that the private key to a certain address was lost by 
    * calling declareLost and passing the address in question. To prevent random requests
    * a high collateral needs to be posted.
    */
    function declareLost (address _lostAddress) public payable returns (bool){
        require(!isPaused);
        require(msg.value == balances[_lostAddress]*collateralRate);
        claims[_lostAddress][msg.sender] = block.timestamp + 1 minutes;
        indices[_lostAddress].push(msg.sender);
        collaterals[_lostAddress] = collaterals[_lostAddress].add(msg.value);
        emit ClaimMade(_lostAddress, msg.sender, claims[_lostAddress][msg.sender]);
    }
    
//    /** @dev Can claim the collateral if key is not lost
//     */
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

    
//     /** @dev Can claim the tokens if key is really lost
//     */
    function deleteClaim(address _lostAddress, address _claimerAddress) public onlyOwner() returns (bool){
        claims[_lostAddress][_claimerAddress] = 0;
        emit ClaimDeleted(_lostAddress, _claimerAddress);
        return true;
    }

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