pragma solidity 0.8.25;

import { ResilientOracleInterface } from '../../oracle/contracts/interfaces/OracleInterface.sol';
    
contract IVToken {
    address public underlying;
}    


contract MockPriceOracleUnderlyingPrice is ResilientOracleInterface {
  mapping(address => uint256) public prices;

  constructor() {}

  function updatePrice(address vToken) external {
    prices[vToken] = prices[vToken];
  }

  function updateAssetPrice(address asset) external {
    prices[asset] = prices[asset];
  }

  function setPrice(address vToken, uint256 price) external {
    address asset = IVToken(vToken).underlying();
    prices[vToken] = price;
    prices[asset] = price;
  }

  function getAssetTokenAmount(address vToken, uint256 value) external view returns (uint256) {
    return value / prices[vToken];
  }

  function getPrice(address asset) external view returns (uint256) {
    return prices[asset];
  }

  function getUnderlyingPrice(address vToken) external view returns (uint256) {
    return prices[vToken];
  }
}
