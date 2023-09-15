// SPDX-License-Identifier: MIT
// 1. Pragma
pragma solidity ^0.8.7;
// 2. Imports
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";
import "@openzeppelin/contracts/utils/Address.sol";


// 3. Interfaces, Libraries, Contracts
error FundMe__NotOwner();

/**@title A sample Funding Contract
 * @author Patrick Collins
 * @notice This contract is for creating a sample funding contract
 * @dev This implements price feeds as our library
 */
contract FundMe {
    // Type Declarations
    using PriceConverter for uint256;

    // State variables
    uint256 public constant MINIMUM_USD = 5; //50 * 10**18;
    address private immutable i_owner;
    address[] public s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;
    AggregatorV3Interface private s_priceFeed;


    // Events (we have none!)
    event FundReceived(address indexed contributor, uint256 amount);
    event Withdrawal(address sender, string message1, uint256 amount, string message2, address funder, string message3);
    event GasCost(string message4, uint256 gasCost);
    event Refund(uint256 amount, string message5, address investor);




    // Modifiers
    modifier onlyOwner() {
        // require(msg.sender == i_owner);
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    // Functions Order:
    //// constructor
    //// receive
    //// fallback
    //// external
    //// public
    //// internal
    //// private
    //// view / pure




    constructor(address priceFeed) {
        s_priceFeed = AggregatorV3Interface(priceFeed);
        i_owner = msg.sender;
    }

    /// @notice Funds our contract based on the ETH/USD price
    function fund() public payable {
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "You need to spend more ETH!"
        );
        // require(PriceConverter.getConversionRate(msg.value) >= MINIMUM_USD, "You need to spend more ETH!");
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
        emit FundReceived(msg.sender, msg.value.getConversionRate(s_priceFeed));

    }
    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        //uint balanceBeforeWithdrawal = address(this).balance;
        // Transfer vs call vs Send
        // payable(msg.sender).transfer(address(this).balance);
        // (bool success, ) = i_owner.call{value: address(this).balance}("");
        // require(success, "call failed");
        payable(i_owner).transfer(address(this).balance);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
        emit Withdrawal(msg.sender, "sent ", address(this).balance," to",i_owner, " successfully");

    }

    function cheaperWithdraw() public onlyOwner {
        address[] memory funders = s_funders;
        // mappings can't be in memory, sorry!
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        // payable(msg.sender).transfer(address(this).balance);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    /** @notice Gets the amount that an address has funded
     *  @param fundingAddress the address of the funder
     *  @return the amount funded
     */
    function getAddressToAmountFunded(address fundingAddress)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[fundingAddress];
    }

   // function getVersion() public view returns (uint256) {
   //     return s_priceFeed.version();
   // }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

  //  function getOwner() public view returns (address) {
   //     return i_owner;
   // }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }


    function refund(address payable userAddress, uint256 refundAmount) public onlyOwner {
        require(userAddress != address(0), "User address is undefined");
        //require(Address.isContract(userAddress), "User address is not a contract");
        require(s_addressToAmountFunded[userAddress] > 0, "User has not sent any money to the contract yet");
        uint256 netAmountFunded = s_addressToAmountFunded[userAddress]; //- contributions[userAddress];
        require(refundAmount <= netAmountFunded, "Refund amount is more than the net amount funded");
        uint256 gasCost = tx.gasprice * 21000; // 21000 is the gas cost for a transfer
        emit GasCost("Gas cost is:", gasCost);

        require(refundAmount + gasCost <= address(this).balance, "Not enough funds in the contract to refund");
        s_addressToAmountFunded[userAddress] -= refundAmount;
        userAddress.transfer(refundAmount - gasCost);
        emit Refund(refundAmount - gasCost, "successfully refunded to", userAddress);

    }
    


}



