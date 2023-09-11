import deployPoolLens from '@venusprotocol/isolated-pools/dist/deploy/009-deploy-vtokens';

deployPoolLens.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default deployPoolLens;
