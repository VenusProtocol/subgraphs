/* eslint-disable prefer-const */
// to satisfy AS compiler
// For each division by 10, add one to exponent to truncate one significant figure
import { Address, BigDecimal, BigInt, Bytes, log } from '@graphprotocol/graph-ts';

import { Comptroller as ComptrollerContract } from '../../generated/Comptroller/Comptroller';
import {
  Account,
  AccountVToken,
  AccountVTokenTransaction,
  Comptroller,
} from '../../generated/schema';
import { VToken } from '../../generated/templates';
import { BEP20 } from '../../generated/templates/VToken/BEP20';
import { updateMarket } from './markets';

const comptrollerAddress = Address.fromString('0xfd36e2c2a6789db23113685031d7f16329158384');

export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bd = BigDecimal.fromString('1');
  for (let i = 0; i < decimals; i++) {
    bd = bd.times(BigDecimal.fromString('10'));
  }
  return bd;
}

export let mantissaFactor = 18;
export let vTokenDecimals = 8;
export let mantissaFactorBD: BigDecimal = exponentToBigDecimal(18);
export let vTokenDecimalsBD: BigDecimal = exponentToBigDecimal(8);
export let zeroBD = BigDecimal.fromString('0');

export function createAccountVToken(
  vTokenStatsID: string,
  symbol: string,
  account: string,
  marketID: string,
): AccountVToken {
  let vTokenStats = new AccountVToken(vTokenStatsID);
  vTokenStats.symbol = symbol;
  vTokenStats.market = marketID;
  vTokenStats.account = account;
  vTokenStats.accrualBlockNumber = BigInt.fromI32(0);
  // we need to set an initial real onchain value to this otherwise it will never
  // be accurate
  const vTokenContract = BEP20.bind(Address.fromString(marketID));
  vTokenStats.vTokenBalance = new BigDecimal(vTokenContract.balanceOf(Address.fromString(account)));
  // log.debug('[createAccountVToken] vTokenBalance: {}, account: {}, vToken: {}', [vTokenStats.vTokenBalance.toString(), account, marketID]);

  vTokenStats.totalUnderlyingSupplied = zeroBD;
  vTokenStats.totalUnderlyingRedeemed = zeroBD;
  vTokenStats.accountBorrowIndex = zeroBD;
  vTokenStats.totalUnderlyingBorrowed = zeroBD;
  vTokenStats.totalUnderlyingRepaid = zeroBD;
  vTokenStats.storedBorrowBalance = zeroBD;
  vTokenStats.enteredMarket = false;
  return vTokenStats;
}

export function createAccount(accountID: string): Account {
  let account = new Account(accountID);
  account.countLiquidated = 0;
  account.countLiquidator = 0;
  account.hasBorrowed = false;
  account.save();
  return account;
}

export function getOrCreateAccountVTokenTransaction(
  accountID: string,
  txHash: Bytes,
  timestamp: BigInt,
  block: BigInt,
  logIndex: BigInt,
): AccountVTokenTransaction {
  let id = accountID
    .concat('-')
    .concat(txHash.toHexString())
    .concat('-')
    .concat(logIndex.toString());
  let transaction = AccountVTokenTransaction.load(id);

  if (transaction == null) {
    transaction = new AccountVTokenTransaction(id);
    transaction.account = accountID;
    transaction.tx_hash = txHash; // eslint-disable-line @typescript-eslint/camelcase
    transaction.timestamp = timestamp;
    transaction.block = block;
    transaction.logIndex = logIndex;
    transaction.save();
  }

  return transaction as AccountVTokenTransaction;
}

export function updateCommonVTokenStats(
  marketID: string,
  marketSymbol: string,
  accountID: string,
  txHash: Bytes,
  timestamp: BigInt,
  blockNumber: BigInt,
  logIndex: BigInt,
): AccountVToken {
  let vTokenStatsID = marketID.concat('-').concat(accountID);
  let vTokenStats = AccountVToken.load(vTokenStatsID);
  if (vTokenStats == null) {
    vTokenStats = createAccountVToken(vTokenStatsID, marketSymbol, accountID, marketID);
  }
  getOrCreateAccountVTokenTransaction(vTokenStatsID, txHash, timestamp, blockNumber, logIndex);
  vTokenStats.accrualBlockNumber = blockNumber;
  return vTokenStats as AccountVToken;
}

export function ensureComptrollerSynced(blockNumber: i32, blockTimestamp: i32): Comptroller {
  let comptroller = Comptroller.load('1');
  if (comptroller) {
    return comptroller;
  }

  comptroller = new Comptroller('1');
  // If we want to start indexing from a block behind markets creation, we might have to
  // wait a very long time to get a market related event being triggered, before which we
  // can't get any market info, so here we manually fill up market info
  const comptrollerContract = ComptrollerContract.bind(comptrollerAddress);

  // init
  comptroller.priceOracle = comptrollerContract.oracle();
  comptroller.closeFactor = comptrollerContract.closeFactorMantissa();
  comptroller.liquidationIncentive = comptrollerContract.liquidationIncentiveMantissa();
  comptroller.maxAssets = comptrollerContract.maxAssets();

  log.debug(
    '[ensureComptrollerSynced] comptroller info completed, oracle: {} closeFactor: {} liquidationIncentive: {} maxAssets: {}',
    [
      comptroller.priceOracle.toHexString(),
      comptroller.closeFactor.toString(),
      comptroller.liquidationIncentive.toString(),
      comptroller.maxAssets.toString(),
    ],
  );

  comptroller.save();

  const allMarkets = comptrollerContract.getAllMarkets();

  log.debug('[ensureComptrollerSynced] all markets length: {}', [allMarkets.length.toString()]);

  for (let i = 0; i < allMarkets.length; i++) {
    updateMarket(allMarkets[i], blockNumber, blockTimestamp);
    VToken.create(allMarkets[i]);
  }

  return comptroller;
}
