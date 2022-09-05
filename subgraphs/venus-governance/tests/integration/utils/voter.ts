import BigNumber from 'bignumber.js';
import { Contract } from 'ethers';

import { normalizeMantissa } from '../utils/math';

export async function enfranchiseAccount(
  xvs: Contract,
  xvsVault: Contract,
  account: any,
  amount: BigNumber,
) {
  await xvs.connect(account).approve(xvsVault.address, normalizeMantissa(1e10, 1e18).toFixed());
  await xvs.transfer(account.address, amount.times(1.5).toFixed());

  await xvsVault.connect(account).deposit(xvs.address, 0, amount.toFixed());
  await xvsVault.connect(account).delegate(account.address);
}
