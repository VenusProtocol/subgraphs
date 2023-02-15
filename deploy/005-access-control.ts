import accessControl from '@venusprotocol/isolated-pools/deploy/005-access-control';

accessControl.skip = async () => process.env.PACKAGE !== 'isolated-pools';

export default accessControl;
