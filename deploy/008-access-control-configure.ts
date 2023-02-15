import accessControlConfigure from '@venusprotocol/isolated-pools/deploy/008-access-control-configure';

accessControlConfigure.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default accessControlConfigure;
