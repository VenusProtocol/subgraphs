import upgradeComptroller from '@venusprotocol/isolated-pools/dist/deploy/013-vip-based-config';

upgradeComptroller.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default upgradeComptroller;
