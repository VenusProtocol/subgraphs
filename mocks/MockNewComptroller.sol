pragma solidity 0.8.13;

import "../../isolated-pools/contracts/ComptrollerInterface.sol";
import "hardhat/console.sol";

contract MockNewComptroller is ComptrollerInterface {
  constructor() {}

  function preMintHook(address vToken, address minter, uint256 mintAmount) external virtual {}

  function preRedeemHook(address vToken, address redeemer, uint256 redeemTokens) external virtual {}

  function preBorrowHook(address vToken, address borrower, uint256 borrowAmount) external virtual {}

  function preRepayHook(
    address vToken,
    address payer,
    address borrower,
    uint256 repayAmount
  ) external virtual {}

  function preLiquidateHook(
    address vTokenBorrowed,
    address vTokenCollateral,
    address liquidator,
    address borrower,
    uint256 repayAmount,
    bool skipLiquidityCheck
  ) external virtual {}

  function preSeizeHook(
    address vTokenCollateral,
    address vTokenBorrowed,
    address liquidator,
    address borrower,
    uint256 seizeTokens
  ) external virtual {}

  function preTransferHook(
    address vToken,
    address src,
    address dst,
    uint256 transferTokens
  ) external virtual {}

  function enterMarkets(
    address[] calldata vTokens
  ) external virtual override returns (uint256[] memory) {}

  function exitMarket(address vToken) external virtual override returns (uint256) {}

  function mintAllowed(
    address vToken,
    address minter,
    uint256 mintAmount
  ) external virtual override returns (uint256) {}

  function mintVerify(
    address vToken,
    address minter,
    uint256 mintAmount,
    uint256 mintTokens
  ) external virtual override {}

  function redeemAllowed(
    address vToken,
    address redeemer,
    uint256 redeemTokens
  ) external virtual override returns (uint256) {}

  function redeemVerify(
    address vToken,
    address redeemer,
    uint256 redeemAmount,
    uint256 redeemTokens
  ) external virtual override {}

  function borrowAllowed(
    address vToken,
    address borrower,
    uint256 borrowAmount
  ) external virtual override returns (uint256) {}

  function borrowVerify(
    address vToken,
    address borrower,
    uint256 borrowAmount
  ) external virtual override {}

  function repayBorrowAllowed(
    address vToken,
    address payer,
    address borrower,
    uint256 repayAmount
  ) external virtual override returns (uint256) {}

  function repayBorrowVerify(
    address vToken,
    address payer,
    address borrower,
    uint256 repayAmount,
    uint256 borrowerIndex
  ) external virtual override {}

  function liquidateBorrowAllowed(
    address vTokenBorrowed,
    address vTokenCollateral,
    address liquidator,
    address borrower,
    uint256 repayAmount,
    bool skipLiquidityCheck
  ) external virtual override returns (uint256) {}

  function liquidateBorrowVerify(
    address vTokenBorrowed,
    address vTokenCollateral,
    address liquidator,
    address borrower,
    uint256 repayAmount,
    uint256 seizeTokens
  ) external virtual override {}

  function seizeAllowed(
    address vTokenCollateral,
    address vTokenBorrowed,
    address liquidator,
    address borrower,
    uint256 seizeTokens
  ) external virtual override returns (uint256) {}

  function seizeVerify(
    address vTokenCollateral,
    address vTokenBorrowed,
    address liquidator,
    address borrower,
    uint256 seizeTokens
  ) external virtual override {}

  function transferAllowed(
    address vToken,
    address src,
    address dst,
    uint256 transferTokens
  ) external virtual override returns (uint256) {}

  function transferVerify(
    address vToken,
    address src,
    address dst,
    uint256 transferTokens
  ) external virtual override {}

  function liquidateCalculateSeizeTokens(
    address vTokenBorrowed,
    address vTokenCollateral,
    uint256 repayAmount
  ) external view virtual override returns (uint256, uint256) {}

  function getAllMarkets() external view virtual override returns (VToken[] memory) {}
}
