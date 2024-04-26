import assert from 'assert';
import { createPublicClient, erc20Abi, http } from 'viem';
import { sepolia } from 'viem/chains';

import subgraphClient from '../subgraph-client';

const client = createPublicClient({
  chain: sepolia,
  transport: http('https://ethereum-sepolia.blockpi.network/v1/rpc/public'),
});

const main = async () => {
  const { data } = await subgraphClient.getAccounts();

  const supplierBalanceSum = data.supplierAccounts.reduce(
    (acc: BigInt, curr: { effective_balance: string }) => {
      return BigInt(acc.toString()) + BigInt(curr.effective_balance);
    },
    BigInt(0),
  );

  const borrowerBalanceSum = data.borrowerAccounts.reduce(
    (acc: BigInt, curr: { effective_balance: string }) => {
      return BigInt(acc.toString()) + BigInt(curr.effective_balance);
    },
    BigInt(0),
  );

  // @ts-expect-error @todo fix ts-node incorrect type
  const resp = await client.readContract({
    address: '0x3b8b6E96e57f0d1cD366AaCf4CcC68413aF308D0',
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: ['0x30c31ba6f4652b548fe7a142a949987c3f3bf80b'],
  });
  assert.equal(resp + borrowerBalanceSum, supplierBalanceSum, 'Invariant found');
};

export default main();
