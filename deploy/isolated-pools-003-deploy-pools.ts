import deployPools from '@venusprotocol/isolated-pools/deploy/003-deploy-pools';

deployPools.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default deployPools;
