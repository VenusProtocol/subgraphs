pragma solidity 0.8.13;

import "../../oracle/contracts/interfaces/OracleInterface.sol";
import "hardhat/console.sol";

contract MockPriceOracleUnderlyingPrice is OracleInterface {
    mapping(address => uint256) public prices;

    constructor() {}

    function updatePrice(address vToken) external {}

    function setPrice(address vToken, uint256 price) public {
        prices[vToken] = price;
    }

    function getUnderlyingPrice(address vToken) external view returns (uint256) {
        return prices[vToken];
    }
}
