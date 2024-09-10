import assert from 'assert';

import subgraphClient from '../subgraph-client';

const weEths = '0xEF26C64bC06A8dE4CA5D31f119835f9A1d9433b9';
const weEth = '0xb4933AF59868986316Ed37fa865C829Eba2df0C7';

const checkWeEth = async () => {
  const { data } = await subgraphClient.getAccounts(20679412, weEth, weEth);

  const supplierBalanceSum = data!.supplierAccounts.reduce(
    (acc: BigInt, curr: { effective_balance: string }) => {
      return BigInt(acc.toString()) + BigInt(curr.effective_balance);
    },
    BigInt(0),
  );

  const inRange = (num: bigint) => num >= -10000000000n && num <= 10000000000n;
  assert.ok(
    inRange(BigInt(data!.tvl!.tvl) - (supplierBalanceSum as bigint)),
    `TVL: ${data!.tvl!.tvl} supplierBalanceSum: ${supplierBalanceSum}`,
  );
};

const checkWeEths = async () => {
  const { data } = await subgraphClient.getAccounts(20679412, weEths, weEths);

  const supplierBalanceSum = data!.supplierAccounts.reduce(
    (acc: BigInt, curr: { effective_balance: string }) => {
      return BigInt(acc.toString()) + BigInt(curr.effective_balance);
    },
    BigInt(0),
  );

  const inRange = (num: bigint) => num >= -10000000000n && num <= 10000000000n;
  assert.ok(
    inRange(BigInt(data!.tvl!.tvl) - (supplierBalanceSum as bigint)),
    `TVL: ${data!.tvl!.tvl} supplierBalanceSum: ${supplierBalanceSum}`,
  );
};

const main = async () => {
  await checkWeEth();
  await checkWeEths();
};

export default main();
