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
      votes
    }
  }
  `;
