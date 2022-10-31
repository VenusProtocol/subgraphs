export const queryPools = () => `{
  pools {
    id
    name
    creator
    blockPosted
    timestampPosted
    riskRating
    category
    logoUrl
    description
    priceOracle
    closeFactor
    liquidationIncentive
    maxAssets
    markets {
      id
    }
  }
}`;


export const queryMarkets = () => `{
  markets {
    id
    pool
    borrowRate
    cash
    collateralFactor
    exchangeRate
    interestRateModelAddress
    name
    reserves
    supplyRate
    symbol
    totalBorrows
    totalSupply
    underlyingAddress
    underlyingName
    underlyingPrice
    underlyingSymbol
    borrowCap
    minLiquidatableAmount
    accrualBlockNumber
    blockTimestamp
    borrowIndex
    reserveFactor
    underlyingPriceUsd
    underlyingDecimals
  }
}`

export const queryAccounts = () => `{
  accounts {
    id
  }
}`

export const queryAccountVTokens = () => `{
  accountVTokens {
    id
  }
}`


export const queryAccountVTokenTransactions = () => `{
  accountVTokenTransactions {
   id
  }
}`