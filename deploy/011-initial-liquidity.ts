import upgradeComptroller from '@venusprotocol/isolated-pools/dist/deploy/011-initial-liquidity';

upgradeComptroller.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default upgradeComptroller;
