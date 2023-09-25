import upgradeComptroller from '@venusprotocol/isolated-pools/dist/deploy/012-transfer-pools-ownership';

upgradeComptroller.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default upgradeComptroller;
