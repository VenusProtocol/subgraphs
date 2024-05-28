import mainnetDeployments from '@venusprotocol/protocol-reserve/deployments/bscmainnet_addresses.json';
import chapelDeployments from '@venusprotocol/protocol-reserve/deployments/bsctestnet_addresses.json';
import fs from 'fs';
import Mustache from 'mustache';

export const getNetwork = () => {
  const supportedNetworks = ['chapel', 'bsc', 'docker'] as const;
  const network = process.env.NETWORK;
  // @ts-expect-error network env var is unknown here
  if (!supportedNetworks.includes(network)) {
    throw new Error(`NETWORK env var must be set to one of ${supportedNetworks}`);
  }
  return network as (typeof supportedNetworks)[number];
};

const main = () => {
  const network = getNetwork();
  const config = {
    docker: {
      network: 'hardhat',
      converterNetworkAddress: '0x0000000000000000000000000000000000000000',
      btcbPrimeConverterAddress: '0x0000000000000000000000000000000000000000',
      ethPrimeConverterAddress: '0x0000000000000000000000000000000000000000',
      riskFundConverterAddress: '0x0000000000000000000000000000000000000000',
      usdcPrimeConverterAddress: '0x0000000000000000000000000000000000000000',
      usdtPrimeConverterAddress: '0x0000000000000000000000000000000000000000',
      xvsVaultConverterAddress: '0x0000000000000000000000000000000000000000',
      riskFundAddress: '0x0000000000000000000000000000000000000000',
      startBlock: 0,
    },
    chapel: {
      network: 'chapel',
      converterNetworkAddress: chapelDeployments.addresses.ConverterNetwork,
      btcbPrimeConverterAddress: chapelDeployments.addresses.BTCBPrimeConverter,
      ethPrimeConverterAddress: chapelDeployments.addresses.ETHPrimeConverter,
      riskFundConverterAddress: chapelDeployments.addresses.RiskFundConverter,
      usdcPrimeConverterAddress: chapelDeployments.addresses.USDCPrimeConverter,
      usdtPrimeConverterAddress: chapelDeployments.addresses.USDTPrimeConverter,
      xvsVaultConverterAddress: chapelDeployments.addresses.XVSVaultConverter,
      riskFundAddress: chapelDeployments.addresses.RiskFundV2,
      startBlock: '36750497',
    },
    bsc: {
      network: 'bsc',
      converterNetworkAddress: mainnetDeployments.addresses.ConverterNetwork,
      btcbPrimeConverterAddress: mainnetDeployments.addresses.BTCBPrimeConverter,
      ethPrimeConverterAddress: mainnetDeployments.addresses.ETHPrimeConverter,
      riskFundConverterAddress: mainnetDeployments.addresses.RiskFundConverter,
      usdcPrimeConverterAddress: mainnetDeployments.addresses.USDCPrimeConverter,
      usdtPrimeConverterAddress: mainnetDeployments.addresses.USDTPrimeConverter,
      xvsVaultConverterAddress: mainnetDeployments.addresses.XVSVaultConverter,
      riskFundAddress: mainnetDeployments.addresses.RiskFundV2,
      startBlock: '32659400',
    },
  };

  const yamlTemplate = fs.readFileSync('template.yaml', 'utf8');
  const yamlOutput = Mustache.render(yamlTemplate, config[network]);
  fs.writeFileSync('subgraph.yaml', yamlOutput);

  const configTemplate = fs.readFileSync('src/constants/config-template', 'utf8');
  const tsOutput = Mustache.render(configTemplate, config[network]);
  fs.writeFileSync('src/constants/config.ts', tsOutput);
};

main();
