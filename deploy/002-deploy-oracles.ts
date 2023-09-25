import deployOracle from '@venusprotocol/oracle/dist/deploy/1-deploy-oracles';

deployOracle.skip = async () => process.env.PACKAGE == 'venus-governance';

export default deployOracle;
