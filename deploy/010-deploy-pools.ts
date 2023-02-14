import deployPoolLens from '@venusprotocol/isolated-pools/deploy/010-deploy-pools';

deployPoolLens.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default deployPoolLens;
