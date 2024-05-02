pragma solidity 0.8.25;

import { ResilientOracleInterface } from '../../oracle/contracts/interfaces/OracleInterface.sol';
import 'hardhat/console.sol';

contract MockPriceOracleUnderlyingPrice is ResilientOracleInterface {
  mapping(address => uint256) public prices;

  constructor() {}

  function updatePrice(address vToken) external {
    prices[vToken] = prices[vToken];
  }

  function updateAssetPrice(address asset) external {
    prices[asset] = prices[asset];
  }

  function setPrice(address vToken, uint256 price) public {
    prices[vToken] = price;
  }

  function getPrice(address asset) external view returns (uint256) {
    return 0;
  }

  function getUnderlyingPrice(address vToken) external view returns (uint256) {
    return prices[vToken];
  }
}
