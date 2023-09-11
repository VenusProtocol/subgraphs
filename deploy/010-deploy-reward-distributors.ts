import deployPoolLens from '@venusprotocol/isolated-pools/dist/deploy/010-deploy-reward-distributors';

deployPoolLens.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default deployPoolLens;
