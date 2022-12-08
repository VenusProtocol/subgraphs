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
    minLiquidatableCollateral
    maxAssets
    markets {
      id
      pool {
        id
      }
    }
  }
}`;

export const queryMarkets = () => `{
  markets {
    id
    pool {
      id
    }
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
    accrualBlockNumber
    blockTimestamp
    borrowIndex
    reserveFactor
    underlyingPriceUsd
    underlyingDecimals
  }
}`;

export const queryAccounts = (address?: string) => `{
  ${address ? `account(id: "${address.toLowerCase()}")` : 'accounts'} {
    id
    tokens {
      id
    }
    countLiquidated
    countLiquidator
    hasBorrowed
  }
}`;

export const queryAccountVTokens = (id: string) => `{
  accountVTokens( id: "${id}") {
    id
    market {
      id
    }
    symbol
    account {
      id
    }
    transactions { 
      id
    }
    enteredMarket
    vTokenBalance
    totalUnderlyingSupplied
    totalUnderlyingRedeemed
    accountBorrowIndex
    totalUnderlyingBorrowed
    totalUnderlyingRepaid
    storedBorrowBalance
  }
}`;

export const queryAccountVTokenTransactions = () => `{
  accountVTokenTransactions {
   id
  }
}`;
