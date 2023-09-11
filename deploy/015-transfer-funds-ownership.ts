import upgradeComptroller from '@venusprotocol/isolated-pools/dist/deploy/015-transfer-funds-ownership';

upgradeComptroller.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default upgradeComptroller;
