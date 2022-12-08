import configureFeeds from '@venusprotocol/oracle/deploy/2-configure-feeds';

configureFeeds.skip = async () => process.env.PACKAGE == 'venus-governace';

export default configureFeeds;
