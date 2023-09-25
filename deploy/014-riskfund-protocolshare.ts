import upgradeComptroller from '@venusprotocol/isolated-pools/dist/deploy/014-riskfund-protocolshare';

upgradeComptroller.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default upgradeComptroller;
