import assert from 'assert';
import { parseUnits } from 'ethers/lib/utils';
import createSubgraphClient from '../subgraph-client';

const weEths = '0xEF26C64bC06A8dE4CA5D31f119835f9A1d9433b9';
const weEth = '0xb4933AF59868986316Ed37fa865C829Eba2df0C7';

const subgraphClient = createSubgraphClient(
  'https://gateway.thegraph.com/api/71ddbc81f1c42517b3929d56bc6ce8e8/subgraphs/id/3mxXR9oB3gc12N3jjs4XfzpuqsRZKt5rWv6fhgYsyDgq',
);

const checkWeEth = async () => {
  const { data } = await subgraphClient.getAccounts(21324416, weEth, weEth);

  const supplierBalanceSum = data!.supplierAccounts.reduce(
    (acc: BigInt, curr: { effective_balance: string }) => {
      return BigInt(acc.toString()) + parseUnits(curr.effective_balance, 18).toBigInt();
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
  const { data } = await subgraphClient.getAccounts(21324416, weEths, weEths);

  const supplierBalanceSum = data!.supplierAccounts.reduce(
    (acc: BigInt, curr: { effective_balance: string }) => {
      return BigInt(acc.toString()) + parseUnits(curr.effective_balance, 18).toBigInt();
    },
    BigInt(0),
  );

  const inRange = (num: bigint) => num >= -10000000000n && num <= 10000000000n;

  assert.ok(
    inRange(parseUnits(data!.tvl!.tvl, 18).toBigInt() - (supplierBalanceSum as bigint)),
    `TVL: ${parseUnits(data!.tvl!.tvl, 18).toBigInt()} supplierBalanceSum: ${supplierBalanceSum}`,
  );
};

const main = async () => {
  await checkWeEth();
  await checkWeEths();
};

export default main();
