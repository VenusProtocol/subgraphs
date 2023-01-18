pragma solidity 0.8.13;

import "../../oracle/contracts/interfaces/OracleInterface.sol";
import "hardhat/console.sol";

contract MockPriceOracleLowUnderlyingPrice is OracleInterface {
    constructor() {}

    function updatePrice(address vToken) external {}

    function getUnderlyingPrice(address vToken) external view returns (uint256) {
        return 10**5;
    }
}
