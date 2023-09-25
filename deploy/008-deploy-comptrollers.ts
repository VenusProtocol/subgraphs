import accessControlConfigure from '@venusprotocol/isolated-pools/dist/deploy/008-deploy-comptrollers';

accessControlConfigure.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default accessControlConfigure;
