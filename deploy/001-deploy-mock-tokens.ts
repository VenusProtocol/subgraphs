import deployMockTokens from '@venusprotocol/isolated-pools/deploy/001-deploy-mock-tokens';

deployMockTokens.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default deployMockTokens;
