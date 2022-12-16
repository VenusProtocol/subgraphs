import { DelegateChanged, DelegateVotesChanged, Transfer } from '../../generated/XVSToken/XVSToken';
import { ZERO_ADDRESS } from '../constants';
import {
  updateDelegateChanged,
  updateDelegateVoteChanged,
  updateReceivedXvs,
  updateSentXvs,
} from '../operations/update';

// - event: DelegateChanged(indexed address,indexed address,indexed address)
//   handler: handleDelegateChanged

export function handleDelegateChanged(event: DelegateChanged): void {
  updateDelegateChanged<DelegateChanged>(event);
}

// - event: DelegateVotesChanged(indexed address,uint256,uint256)
//   handler: handleDelegateVotesChanged

export function handleDelegateVotesChanged(event: DelegateVotesChanged): void {
  updateDelegateVoteChanged(event);
}

// - event: Transfer(indexed address,indexed address,uint256)
//   handler: handleTransfer

export function handleTransfer(event: Transfer): void {
  const params = event.params;

  if (params.from.toHexString() != ZERO_ADDRESS) {
    updateSentXvs(params.from, params.amount);
  }

  updateReceivedXvs(params.to, params.amount);
}
