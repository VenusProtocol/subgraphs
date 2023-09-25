import deployPoolLens from '@venusprotocol/isolated-pools/dist/deploy/007-deploy-pool-lens';

deployPoolLens.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default deployPoolLens;
