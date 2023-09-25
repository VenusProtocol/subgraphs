import deployPoolLens from '@venusprotocol/isolated-pools/dist/deploy/006-deploy-pool-registry';

deployPoolLens.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default deployPoolLens;
