import BigNumber from 'bignumber.js';
import { deployments } from 'hardhat';
import { normalizeMantissa } from 'venus-subgraph-utils';

export async function transferToAccount(
  tokenSymbol: 'vUSDC' | 'vETH',
  account: any,
  amount: BigNumber,
) {
  const token = await deployments.get(tokenSymbol);
  await token.connect(account).approve(token.address, normalizeMantissa(1e10, 1e18).toFixed());
  await token.transfer(account.address, amount.toFixed());
}
