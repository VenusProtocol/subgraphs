import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';

import exponentToBigDecimal from '../utilities/exponentToBigDecimal';

export const zeroBigDecimal = BigDecimal.fromString('0');
export const zeroBigInt32 = BigInt.fromString('0');
export const oneBigInt = BigInt.fromString('1');

export const mantissaFactor = 18;
export const defaultMantissaFactorBigDecimal: BigDecimal = exponentToBigDecimal(mantissaFactor);

export const vTokenDecimals = 8;
export const vTokenDecimalsBigDecimal: BigDecimal = exponentToBigDecimal(vTokenDecimals);

export const BORROW = 'BORROW';
export const MINT = 'MINT';
export const REDEEM = 'REDEEM';
export const REPAY = 'REPAY';
export const SEIZE = 'SEIZE';
export const LIQUIDATE = 'LIQUIDATE';
export const TRANSFER = 'TRANSFER';
export const ENTER_MARKET = 'ENTER_MARKET';
export const EXIT_MARKET = 'EXIT_MARKET';

export const UNDERLYING_AMOUNT = 'UNDERLYING_AMOUNT';
export const ACCOUNT_BORROWS = 'ACCOUNT_BORROWS';
export const UNDERLYING_REPAY_AMOUNT = 'UNDERLYING_REPAY_AMOUNT';

export const VERY_HIGH_RISK = 'VERY_HIGH_RISK';
export const HIGH_RISK = 'HIGH_RISK';
export const MEDIUM_RISK = 'MEDIUM_RISK';
export const LOW_RISK = 'LOW_RISK';
export const MINIMAL_RISK = 'MINIMAL_RISK';

export const RiskRatings = [VERY_HIGH_RISK, HIGH_RISK, MEDIUM_RISK, LOW_RISK, MINIMAL_RISK];

export const Actions = [
  MINT,
  REDEEM,
  BORROW,
  REPAY,
  SEIZE,
  LIQUIDATE,
  TRANSFER,
  ENTER_MARKET,
  EXIT_MARKET,
];

export const AUCTION_STARTED = 'STARTED';
export const AUCTION_ENDED = 'ENDED';
export const AUCTION_NOT_STARTED = 'NOT_STARTED';

export const AUCTION_LARGE_POOL_DEBT = 'LARGE_POOL_DEBT';
export const AUCTION_LARGE_RISK_FUND = 'LARGE_RISK_FUND';

export const AuctionTypes = [AUCTION_LARGE_POOL_DEBT, AUCTION_LARGE_RISK_FUND];
