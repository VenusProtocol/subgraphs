import assert from 'assert';

import subgraphClient from '../subgraph-client';

const main = async () => {
  const { data } = await subgraphClient.getAccounts(19738555);

  const supplierBalanceSum = data.supplierAccounts.reduce(
    (acc: BigInt, curr: { effective_balance: string }) => {
      return BigInt(acc.toString()) + BigInt(curr.effective_balance);
    },
    BigInt(0),
  );

  const inRange = (num: bigint) => num >= -5000n && num <= 5000n;
  assert.ok(inRange(BigInt(data.tvl.tvl) - supplierBalanceSum));
};

export default main();
