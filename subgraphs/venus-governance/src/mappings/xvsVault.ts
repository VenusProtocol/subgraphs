/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-empty-function */
import { BigInt } from '@graphprotocol/graph-ts';

import {
  DelegateChangedV2,
  DelegateVotesChangedV2,
  Deposit,
  RequestedWithdrawal,
} from '../../generated/XVSVault/XVSVault';
import { xvsVaultPid } from '../constants/config';
import { getOrCreateDelegate } from '../operations/getOrCreate';
import { updateDelegateChanged, updateDelegateVoteChanged } from '../operations/update';
import { BIGINT_ONE, BIGINT_ZERO } from '../constants';
import { getGovernanceEntity } from '../operations/get';

// - event: DelegateChanged(indexed address,indexed address,indexed address)
//   handler: handleDelegateChanged

export function handleDelegateChanged(event: DelegateChangedV2): void {
  updateDelegateChanged<DelegateChangedV2>(event);
}

// - event: DelegateVotesChanged(indexed address,uint256,uint256)
//   handler: handleDelegateVotesChanged

export function handleDelegateVotesChanged(event: DelegateVotesChangedV2): void {
  updateDelegateVoteChanged<DelegateVotesChangedV2>(event);
}

export function handleDeposit(event: Deposit): void {
  // Only care about XVS Vault
  if (event.params.pid.equals(BigInt.fromString(xvsVaultPid))) {
    const user = event.params.user;
    const amount = event.params.amount;
    // Update user's staked XVS
    const result = getOrCreateDelegate(user);
    const previousStake = result.entity.stakedXvsMantissa;
    result.entity.stakedXvsMantissa = result.entity.stakedXvsMantissa.plus(amount);
    result.entity.save();

    if (previousStake.equals(BIGINT_ZERO) && amount.gt(BIGINT_ZERO)) {
      const governance = getGovernanceEntity();
      governance.totalDelegates = governance.totalDelegates.plus(BIGINT_ONE);
      governance.save();
    }
  }
}

export function handleRequestedWithdrawal(event: RequestedWithdrawal): void {
  // Only care about XVS Vault
  if (event.params.pid.equals(BigInt.fromString(xvsVaultPid))) {
    const user = event.params.user;
    const amount = event.params.amount;
    const result = getOrCreateDelegate(user);
    const newAmount = result.entity.stakedXvsMantissa.minus(amount);
    result.entity.stakedXvsMantissa = newAmount;
    result.entity.save();
    // Update their delegate
    if (newAmount.equals(BIGINT_ZERO)) {
      const governance = getGovernanceEntity();
      governance.totalDelegates = governance.totalDelegates.minus(BIGINT_ONE);
      governance.save();
    }
  }
}
