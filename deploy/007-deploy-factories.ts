import deployPoolLens from '@venusprotocol/isolated-pools/deploy/007-deploy-factories';

deployPoolLens.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default deployPoolLens;
