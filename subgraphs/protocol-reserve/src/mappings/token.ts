import { TokenConverterConfig } from '../../generated/schema';
import { Transfer } from '../../generated/templates/ERC20/ERC20';
import { getTokenConverter } from '../operations/get';

export function handleTransferIn(event: Transfer): void {
  const tokenConverter = getTokenConverter(event.params.to)!;
  const configs = tokenConverter.configs.load();
  configs.reduce((e: Transfer, curr: TokenConverterConfig) => {
    if (e.address.equals(curr.tokenOut)) {
      curr.tokenOutBalance = curr.tokenOutBalance.plus(e.params.value);
      curr.save();
    }
    return e;
  }, event);
}

export function handleTransferOut(event: Transfer): void {
  const tokenConverter = getTokenConverter(event.params.from)!;
  const configs = tokenConverter.configs.load();
  configs.reduce((e: Transfer, curr: TokenConverterConfig) => {
    if (e.address.equals(curr.tokenOut)) {
      curr.tokenOutBalance = curr.tokenOutBalance.minus(e.params.value);
      curr.save();
    }
    return e;
  }, event);
}
