import { DistributedBorrowerVenus } from '../../generated/DiamondComptroller/Comptroller';
import { Market } from '../../generated/schema';

export function updateXvsBorrowState(market: Market, event: DistributedBorrowerVenus): void {
  market.xvsBorrowStateIndex = event.params.venusBorrowIndex;
  market.xvsBorrowStateBlock = event.block.number;
  market.save();
}
