import upgradeComptroller from '@venusprotocol/isolated-pools/deploy/011-upgrade-comptroller';

upgradeComptroller.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default upgradeComptroller;
