import deployPoolLens from '@venusprotocol/isolated-pools/deploy/004-swap-router';

deployPoolLens.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default deployPoolLens;
