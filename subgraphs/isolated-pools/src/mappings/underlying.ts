import { Upgraded } from '../../generated/templates/Underlying/BEP20';
import { BEP20 } from '../../generated/PoolRegistry/BEP20';
import { getOrCreateToken } from '../operations/getOrCreate';

export function handleUpgraded(event: Upgraded): void {
  const token = getOrCreateToken(event.address);
  const erc20 = BEP20.bind(event.address);
  token.name = erc20.name();
  token.symbol = erc20.symbol();
  token.save();
}
