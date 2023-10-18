import { BigInt, log } from '@graphprotocol/graph-ts';

import { GovernorBravoDelegate2 } from '../../generated/GovernorBravoDelegate2/GovernorBravoDelegate2';
import { Timelock } from '../../generated/GovernorBravoDelegate2/Timelock';
import { Delegate, Governance, GovernanceRoute, Proposal } from '../../generated/schema';
import { BIGINT_ZERO } from '../constants';
import { governorBravoDelegatorAddress, nullAddress } from '../constants/addresses';

/**
 * While technically this function does also create, we don't care because it only happens once as the id is a constant.
 * @returns Governance
 */
export const getGovernanceEntity = (): Governance => {
  let governance = Governance.load(governorBravoDelegatorAddress.toHex());
  if (!governance) {
    const governorBravoDelegate2 = GovernorBravoDelegate2.bind(governorBravoDelegatorAddress);
    governance = new Governance(governorBravoDelegatorAddress.toHex());
    governance.proposals = BIGINT_ZERO;
    governance.totalDelegates = BIGINT_ZERO;
    governance.totalVoters = BIGINT_ZERO;
    governance.totalVotesMantissa = BIGINT_ZERO;
    // Mocking values until we can correctly index current governance contract
    governance.admin = nullAddress;
    governance.implementation = nullAddress;
    governance.guardian = nullAddress;
    governance.quorumVotesMantissa = BIGINT_ZERO;
    governance.proposalMaxOperations = BIGINT_ZERO;

    // There is only one active governance entity
    // but while indexing proposals created with previous governance contracts all these calls will fail
    // This method only exists on the latest governance interface so if it succeeds we can safely index the contract
    const normalProposalConfigResult = governorBravoDelegate2.try_proposalConfigs(new BigInt(0));
    if (normalProposalConfigResult.reverted === false) {
      governance.admin = governorBravoDelegate2.admin();
      governance.implementation = governorBravoDelegate2.implementation();
      governance.guardian = governorBravoDelegate2.guardian();
      governance.quorumVotesMantissa = governorBravoDelegate2.quorumVotes();
      governance.proposalMaxOperations = governorBravoDelegate2.proposalMaxOperations();
      // Governance Routes are set in initialization
      // Normal
      const normalProposalConfig = normalProposalConfigResult.value;
      const normalTimelockAddress = governorBravoDelegate2.proposalTimelocks(new BigInt(0));
      const normalTimelock = Timelock.bind(normalTimelockAddress);
      const normalGovernanceRoute = new GovernanceRoute('0');
      normalGovernanceRoute.governor = governorBravoDelegatorAddress;
      normalGovernanceRoute.timelock = normalTimelockAddress;
      normalGovernanceRoute.queueDelayBlocks = normalTimelock.delay();
      normalGovernanceRoute.votingDelayBlocks = normalProposalConfig.getVotingDelay();
      normalGovernanceRoute.votingPeriodBlocks = normalProposalConfig.getVotingPeriod();
      normalGovernanceRoute.proposalThresholdMantissa = normalProposalConfig.getProposalThreshold();
      normalGovernanceRoute.save();
      // Fast track
      const fastTrackProposalConfig = governorBravoDelegate2.proposalConfigs(new BigInt(1));
      const fastTrackTimelockAddress = governorBravoDelegate2.proposalTimelocks(new BigInt(1));
      const fastTrackTimelock = Timelock.bind(normalTimelockAddress);
      const fastTrackGovernanceRoute = new GovernanceRoute('1');
      fastTrackGovernanceRoute.governor = governorBravoDelegatorAddress;
      fastTrackGovernanceRoute.timelock = fastTrackTimelockAddress;
      fastTrackGovernanceRoute.queueDelayBlocks = fastTrackTimelock.delay();
      fastTrackGovernanceRoute.votingDelayBlocks = fastTrackProposalConfig.getVotingDelay();
      fastTrackGovernanceRoute.votingPeriodBlocks = fastTrackProposalConfig.getVotingPeriod();
      fastTrackGovernanceRoute.proposalThresholdMantissa =
        fastTrackProposalConfig.getProposalThreshold();
      fastTrackGovernanceRoute.save();
      // Critical
      const criticalProposalConfig = governorBravoDelegate2.proposalConfigs(new BigInt(2));
      const criticalTimelockAddress = governorBravoDelegate2.proposalTimelocks(new BigInt(2));
      const criticalTimelock = Timelock.bind(normalTimelockAddress);
      const criticalGovernanceRoute = new GovernanceRoute('2');
      criticalGovernanceRoute.governor = governorBravoDelegatorAddress;
      criticalGovernanceRoute.timelock = criticalTimelockAddress;
      criticalGovernanceRoute.queueDelayBlocks = criticalTimelock.delay();
      criticalGovernanceRoute.votingDelayBlocks = criticalProposalConfig.getVotingDelay();
      criticalGovernanceRoute.votingPeriodBlocks = criticalProposalConfig.getVotingPeriod();
      criticalGovernanceRoute.proposalThresholdMantissa =
        criticalProposalConfig.getProposalThreshold();
      criticalGovernanceRoute.save();
    }

    governance.save();
  }

  return governance as Governance;
};

export const getProposal = (id: string): Proposal => {
  const proposal = Proposal.load(id);
  if (!proposal) {
    log.critical('Proposal {} not found', [id]);
  }
  return proposal as Proposal;
};

export const getDelegate = (id: string): Delegate => {
  const delegate = Delegate.load(id);
  if (!delegate) {
    log.critical('Delegate {} not found', [id]);
  }
  return delegate as Delegate;
};
