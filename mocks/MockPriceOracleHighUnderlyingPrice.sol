pragma solidity 0.8.13;

import "../../oracle/contracts/interfaces/OracleInterface.sol";
import "hardhat/console.sol";

contract MockPriceOracleHighUnderlyingPrice is OracleInterface {
    constructor() {}

    function updatePrice(address vToken) external {}

    function getUnderlyingPrice(address vToken) external view returns (uint256) {
        if(vToken == 0x5FbDB2315678afecb367f032d93F642f64180aa3) {
            return 10**20;
        }
         
        return 10**15;
    }
}
