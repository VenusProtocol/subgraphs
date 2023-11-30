import { Address, BigInt, Bytes, log } from '@graphprotocol/graph-ts';

import { AccountVToken, Market } from '../../generated/schema';
import { VToken } from '../../generated/templates/VToken/VToken';
import { zeroBigInt32 } from '../constants';
import { createMarket } from '../operations/create';
import { exponentToBigInt } from '../utilities/exponentToBigInt';
import { getUnderlyingPrice } from '../utilities/getUnderlyingPrice';
import { createAccountVToken } from './create';
import { getOrCreateAccountVTokenTransaction } from './getOrCreate';

export const updateCommonVTokenStats = (
  marketId: string,
  marketSymbol: string,
  accountId: string,
  txHash: Bytes,
  timestamp: BigInt,
  blockNumber: BigInt,
  logIndex: BigInt,
): AccountVToken => {
  const accountVTokenId = marketId.concat('-').concat(accountId);
  let accountVToken = AccountVToken.load(accountVTokenId);
  if (accountVToken == null) {
    accountVToken = createAccountVToken(accountVTokenId, marketSymbol, accountId, marketId);
  }
  getOrCreateAccountVTokenTransaction(accountVTokenId, txHash, timestamp, blockNumber, logIndex);
  accountVToken.accrualBlockNumber = blockNumber;
  return accountVToken as AccountVToken;
};

export const updateMarket = (
  marketAddress: Address,
  blockNumber: i32,
  blockTimestamp: i32,
): Market => {
  const marketId = marketAddress.toHexString();
  let market = Market.load(marketId) as Market;
  if (market == null) {
    market = createMarket(marketId);
  }

  // Only updateMarket if it has not been updated this block
  if (market.accrualBlockNumber != blockNumber) {
    const contractAddress = Address.fromString(market.id);
    const contract = VToken.bind(contractAddress);
    market.accrualBlockNumber = contract.accrualBlockNumber().toI32();
    market.blockTimestamp = blockTimestamp;

    const underlyingPriceCents = getUnderlyingPrice(market.id, market.underlyingDecimals);
    market.underlyingPriceCents = underlyingPriceCents;

    /* Exchange rate explanation
       In Practice
        - If you call the vDAI contract on bscscan it comes back (2.0 * 10^26)
        - If you call the vUSDC contract on bscscan it comes back (2.0 * 10^14)
        - The real value is ~0.02. So vDAI is off by 10^28, and vUSDC 10^16
       How to calculate for tokens with different decimals
        - Must div by tokenDecimals, 10^market.underlyingDecimals
        - Must multiply by vtokenDecimals, 10^8
        - Must div by mantissa, 10^18
     */
    const exchangeRateStored = contract.exchangeRateStored();
    market.exchangeRateMantissa = exchangeRateStored;

    const totalSupplyVTokensMantissa = contract.totalSupply();
    market.totalSupplyMantissa = totalSupplyVTokensMantissa
      .times(exchangeRateStored)
      .div(exponentToBigInt(18));

    market.borrowIndexMantissa = contract.borrowIndex();

    market.reservesMantissa = contract.totalReserves();
    market.totalBorrowsMantissa = contract.totalBorrows();

    market.cashMantissa = contract.getCash();

    // Must convert to BigDecimal, and remove 10^18 that is used for Exp in Venus Solidity
    const borrowRatePerBlock = contract.try_borrowRatePerBlock();
    if (borrowRatePerBlock.reverted) {
      log.error('***CALL FAILED*** : vBEP20 supplyRatePerBlock() reverted', []);
      market.exchangeRateMantissa = zeroBigInt32;
    } else {
      market.borrowRateMantissa = borrowRatePerBlock.value;
    }

    // This fails on only the first call to cZRX. It is unclear why, but otherwise it works.
    // So we handle it like this.
    const supplyRatePerBlock = contract.try_supplyRatePerBlock();
    if (supplyRatePerBlock.reverted) {
      log.info('***CALL FAILED*** : vBEP20 supplyRatePerBlock() reverted', []);
      market.supplyRateMantissa = zeroBigInt32;
    } else {
      market.supplyRateMantissa = supplyRatePerBlock.value;
    }
    market.save();
  }
  return market as Market;
};
