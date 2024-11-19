import { DistributedSupplierVenus } from '../../generated/DiamondComptroller/Comptroller';
import { Market } from '../../generated/schema';

export function updateXvsSupplyState(market: Market, event: DistributedSupplierVenus): void {
  market.xvsSupplyStateIndex = event.params.venusSupplyIndex;
  market.xvsSupplyStateBlock = event.block.number;
  market.save();
}
