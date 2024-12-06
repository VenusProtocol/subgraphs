import { providers } from '@0xsequence/multicall';
import { abi as Bep20Abi } from '@venusprotocol/venus-protocol/artifacts/contracts/Tokens/BEP20Interface.sol/BEP20Interface.json';
import { ethers } from 'ethers';
import { assertEqual } from 'venus-subgraph-utils';

import createSubgraphClient from '../../subgraph-client';

const checkMarkets = async (
  provider: providers.MulticallProvider,
  subgraphClient: ReturnType<typeof createSubgraphClient>,
) => {
  const { tokenConverterConfigs } = await subgraphClient.getTokenConverterConfigs();
  for (const tokenConverterConfig of tokenConverterConfigs) {
    const tokenContract = new ethers.Contract(
      tokenConverterConfig.tokenOut.address,
      Bep20Abi,
      provider,
    );

    const balance = await tokenContract.balanceOf(tokenConverterConfig.tokenConverter.id);

    assertEqual(tokenConverterConfig, balance, 'tokenOutBalance');
  }
};

export default checkMarkets;
