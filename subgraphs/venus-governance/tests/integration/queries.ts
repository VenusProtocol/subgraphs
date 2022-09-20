export const queryProposalById = (id: string) => `
  {
    proposal(id: "${id}") {
      id
      proposer
      targets
      values
      signatures
      calldatas
      startBlock
      endBlock
      description
      status
      executionETA
      votes {
        id
        votes
        support
      }
    }
  }
`;

export const queryDelegateById = (id: string) => `
  {
    delegate(id: "${id}") {
      id
      delegatedVotes
      tokenHoldersRepresented
      votes {
        id
        support
        votes
        proposal
      }
      proposals {
        id
      }
    }
  }
`;
