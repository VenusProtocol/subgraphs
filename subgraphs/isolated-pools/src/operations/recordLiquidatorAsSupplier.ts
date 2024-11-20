import { Address, ByteArray, Bytes, crypto, ethereum } from '@graphprotocol/graph-ts';

import { VToken as VTokenContract } from '../../generated/PoolRegistry/VToken';
import { ProtocolSeize } from '../../generated/PoolRegistry/VToken';
import { oneBigInt } from '../constants';
import { getMarket } from './get';
import { getOrCreateAccountVToken } from './getOrCreate';

class LiquidatorTransferMarker {
  current: i32;
  vTokenAddress: Address;

  constructor(vTokenAddress: Address) {
    this.vTokenAddress = vTokenAddress;
  }
}

export const recordLiquidatorAsSupplier = (event: ProtocolSeize): void => {
  if (event.receipt) {
    const reversedLogs = event.receipt!.logs.reverse();
    reversedLogs.reduce<LiquidatorTransferMarker>((acc, curr, idx) => {
      const protocolSeizeTopic = Bytes.fromByteArray(crypto.keccak256(ByteArray.fromUTF8('ProtocolSeize(address,address,uint256)')));

      if (curr.topics.includes(protocolSeizeTopic)) {
        acc.current = idx + 1;
      }

      if (idx == acc.current && acc.current != 0) {
        const liquidator = ethereum.decode('(address)', curr.topics[2])!.toTuple()[0].toAddress();
        const amount = ethereum.decode('(uint256)', curr.data)!.toTuple()[0].toBigInt();

        // Register a Transfer to liquidator +1 supplier count
        const collateralContract = VTokenContract.bind(acc.vTokenAddress);
        const collateralBalanceLiquidator = collateralContract.balanceOf(liquidator);
        const market = getMarket(acc.vTokenAddress)!;
        // Update balance
        const liquidatorAccountVTokenResult = getOrCreateAccountVToken(liquidator, Address.fromBytes(market.pool), acc.vTokenAddress);
        const liquidatorAccountVToken = liquidatorAccountVTokenResult.entity;

        // Creation updates balance
        if (!liquidatorAccountVTokenResult.created) {
          liquidatorAccountVToken.vTokenBalanceMantissa = liquidatorAccountVToken.vTokenBalanceMantissa.plus(amount);
        }
        liquidatorAccountVToken.save();
        // If the transfer amount equals balance it was a funding transfer
        if (collateralBalanceLiquidator.equals(amount)) {
          market.supplierCount = market.supplierCount.plus(oneBigInt);
          market.save();
        }
      }
      return acc;
    }, new LiquidatorTransferMarker(event.address));
  }
};
