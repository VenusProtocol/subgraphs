export const queryPools = () => `{
  pools {
    id
    name
    creator
    blockPosted
    timestampPosted
    riskRating
    category
    logoURL
    description
    priceOracle
    pauseGuardian
    closeFactor
    liquidationIncentive
    maxAssets
  }
}`;
