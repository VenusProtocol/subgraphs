import deployPoolLens from '@venusprotocol/isolated-pools/deploy/005-deploy-pool-lens';

deployPoolLens.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default deployPoolLens;
