import deployPoolLens from '@venusprotocol/isolated-pools/deploy/002-deploy-pool-lens';

deployPoolLens.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default deployPoolLens;
