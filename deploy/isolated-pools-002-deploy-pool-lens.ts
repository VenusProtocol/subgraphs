import deployPoolLens from '@venusprotocol/isolated-pools/deploy/003-deploy-pool-lens';

deployPoolLens.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default deployPoolLens;
