/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-empty-function */
import { DelegateChangedV2, DelegateVotesChangedV2 } from '../../generated/XVSVault/XVSVault';
import { updateDelegateChanged } from '../operations/update';

// - event: DelegateChanged(indexed address,indexed address,indexed address)
//   handler: handleDelegateChanged

export function handleDelegateChanged(event: DelegateChangedV2): void {
  updateDelegateChanged<DelegateChangedV2>(event);
}

// - event: DelegateVotesChanged(indexed address,uint256,uint256)
//   handler: handleDelegateVotesChanged

export function handleDelegateVotesChanged(event: DelegateVotesChangedV2): void {
  // updateDelegateVoteChanged(event);
}
