import { AssetReleased } from '../../generated/ProtocolShareReserve/ProtocolShareReserve';
import { TokenConverterConfig } from '../../generated/schema';
import { getTokenConverter } from '../operations/get';

export function handleAssetReleased(event: AssetReleased): void {
  const tokenConverter = getTokenConverter(event.params.destination);
  if (tokenConverter) {
    const configs = tokenConverter.configs.load();
    configs.reduce((e: AssetReleased, curr: TokenConverterConfig) => {
      if (e.params.asset.equals(curr.tokenOut)) {
        curr.tokenOutBalance = curr.tokenOutBalance.plus(e.params.amount);
        curr.save();
      }
      return e;
    }, event);
  }
}
