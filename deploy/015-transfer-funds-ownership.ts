import upgradeComptroller from '@venusprotocol/isolated-pools/dist/deploy/015-funds-config';

upgradeComptroller.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default upgradeComptroller;
