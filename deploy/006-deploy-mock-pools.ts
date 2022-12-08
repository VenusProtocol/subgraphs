import deployMockPools from '@venusprotocol/isolated-pools/deploy/006-deploy-mock-pools';

deployMockPools.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default deployMockPools;
