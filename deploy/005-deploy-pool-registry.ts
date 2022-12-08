import deployPoolRegistry from '@venusprotocol/isolated-pools/deploy/004-deploy-pool-registry';

deployPoolRegistry.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default deployPoolRegistry;
