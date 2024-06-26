// Subgraph Name
export const SUBGRAPH_ACCOUNT = 'venusprotocol';
export const SUBGRAPH_NAME = 'venus-isolated-pools';

export const SYNC_DELAY = 2000;

export const defaultMarkets = [
  {
    id: '0xC66AB83418C20A65C3f8e83B3d11c8C3a6097b6F',
    pool: {
      id: '0x413b1AfCa96a3df5A686d8BFBF93d30688a7f7D9',
      __typename: 'Pool',
    },
    badDebtMantissa: '0',
    borrowRateMantissa: '0',
    cashMantissa: '10000000000000000000',
    collateralFactorMantissa: '700000000000000000',
    exchangeRateMantissa: '10000000000000000000000000000',
    interestRateModelAddress: '0x8F4ec854Dd12F1fe79500a1f53D0cbB30f9b6134',
    name: 'Venus BTCB',
    reservesMantissa: '0',
    supplyRateMantissa: '0',
    symbol: 'vBTCB',
    underlyingAddress: '0xAA292E8611aDF267e563f334Ee42320aC96D0463',
    underlyingName: 'MockBTCB',
    underlyingSymbol: 'MockBTCB',
    borrowCapMantissa: '1000000000000000000000',
    accrualBlockNumber: 355,
    blockTimestamp: 1706290532,
    borrowIndexMantissa: '1000000000000000000',
    reserveFactorMantissa: '250000000000000000',
    underlyingPriceCentsMantissa: '0',
    underlyingDecimals: 18,
    supplyCapMantissa: '1000000000000000000000',
    accessControlManagerAddress: null,
    supplierCount: '1',
    borrowerCount: '0',
    __typename: 'Market',
  },
  {
    id: '0x71089Ba41e478702e1904692385Be3972B2cBf9e',
    pool: {
      id: '0x413b1AfCa96a3df5A686d8BFBF93d30688a7f7D9',
      __typename: 'Pool',
    },
    badDebtMantissa: '0',
    borrowRateMantissa: '951293759',
    cashMantissa: '10000000000000000000',
    collateralFactorMantissa: '600000000000000000',
    exchangeRateMantissa: '10000000000000000000000000000',
    interestRateModelAddress: '0x5133BBdfCCa3Eb4F739D599ee4eC45cBCD0E16c5',
    name: 'Venus BNX',
    reservesMantissa: '0',
    supplyRateMantissa: '0',
    symbol: 'vBNX',
    underlyingAddress: '0x86A2EE8FAf9A840F7a2c64CA3d51209F9A02081D',
    underlyingName: 'MockBNX',
    underlyingSymbol: 'MockBNX',
    borrowCapMantissa: '478980000000000000000000',
    accrualBlockNumber: 351,
    blockTimestamp: 1706290528,
    borrowIndexMantissa: '1000000069444444407',
    reserveFactorMantissa: '250000000000000000',
    underlyingPriceCentsMantissa: '159000000000000000000',
    underlyingDecimals: 18,
    supplyCapMantissa: '932019000000000000000000',
    accessControlManagerAddress: null,
    supplierCount: '1',
    borrowerCount: '0',
    __typename: 'Market',
  },
  {
    id: '0xaC9fCBA56E42d5960f813B9D0387F3D3bC003338',
    pool: {
      id: '0x02df3a3F960393F5B349E40A599FEda91a7cc1A7',
      __typename: 'Pool',
    },
    badDebtMantissa: '0',
    borrowRateMantissa: '0',
    cashMantissa: '10000000000000000000',
    collateralFactorMantissa: '700000000000000000',
    exchangeRateMantissa: '10000000000000000000000000000',
    interestRateModelAddress: '0x8F4ec854Dd12F1fe79500a1f53D0cbB30f9b6134',
    name: 'Venus USDD',
    reservesMantissa: '0',
    supplyRateMantissa: '0',
    symbol: 'vUSDD',
    underlyingAddress: '0x457cCf29090fe5A24c19c1bc95F492168C0EaFdb',
    underlyingName: 'MockUSDD',
    underlyingSymbol: 'MockUSDD',
    borrowCapMantissa: '1698253000000000000000000',
    accrualBlockNumber: 383,
    blockTimestamp: 1706290560,
    borrowIndexMantissa: '1000000000000000000',
    reserveFactorMantissa: '100000000000000000',
    underlyingPriceCentsMantissa: '159000000000000000000',
    underlyingDecimals: 18,
    supplyCapMantissa: '10601805000000000000000000',
    accessControlManagerAddress: null,
    supplierCount: '1',
    borrowerCount: '0',
    __typename: 'Market',
  },
  {
    id: '0x9BcC604D4381C5b0Ad12Ff3Bf32bEdE063416BC7',
    pool: {
      id: '0x02df3a3F960393F5B349E40A599FEda91a7cc1A7',
      __typename: 'Pool',
    },
    badDebtMantissa: '0',
    borrowRateMantissa: '951293759',
    cashMantissa: '10000000000000000000',
    collateralFactorMantissa: '600000000000000000',
    exchangeRateMantissa: '10000000000000000000000000000',
    interestRateModelAddress: '0x5133BBdfCCa3Eb4F739D599ee4eC45cBCD0E16c5',
    name: 'Venus NFT',
    reservesMantissa: '0',
    supplyRateMantissa: '0',
    symbol: 'vNFT',
    underlyingAddress: '0x276C216D241856199A83bf27b2286659e5b877D3',
    underlyingName: 'MockNFT',
    underlyingSymbol: 'MockNFT',
    borrowCapMantissa: '24654278679000000000000000000',
    accrualBlockNumber: 371,
    blockTimestamp: 1706290548,
    borrowIndexMantissa: '1000000077054794479',
    reserveFactorMantissa: '250000000000000000',
    underlyingPriceCentsMantissa: '159000000000000000000',
    underlyingDecimals: 18,
    supplyCapMantissa: '84985800573000000000000000000',
    accessControlManagerAddress: null,
    supplierCount: '1',
    borrowerCount: '0',
    __typename: 'Market',
  },
  {
    id: '0xaC47e91215fb80462139756f43438402998E4A3a',
    pool: {
      id: '0x02df3a3F960393F5B349E40A599FEda91a7cc1A7',
      __typename: 'Pool',
    },
    badDebtMantissa: '0',
    borrowRateMantissa: '0',
    cashMantissa: '10000000000000000000',
    collateralFactorMantissa: '700000000000000000',
    exchangeRateMantissa: '10000000000000000000000000000',
    interestRateModelAddress: '0x8F4ec854Dd12F1fe79500a1f53D0cbB30f9b6134',
    name: 'Venus MBOX',
    reservesMantissa: '0',
    supplyRateMantissa: '0',
    symbol: 'vMBOX',
    underlyingAddress: '0x22753E4264FDDc6181dc7cce468904A80a363E44',
    underlyingName: 'MockMBOX',
    underlyingSymbol: 'MockMBOX',
    borrowCapMantissa: '3184294000000000000000000',
    accrualBlockNumber: 367,
    blockTimestamp: 1706290544,
    borrowIndexMantissa: '1000000000000000000',
    reserveFactorMantissa: '250000000000000000',
    underlyingPriceCentsMantissa: '159000000000000000000',
    underlyingDecimals: 18,
    supplyCapMantissa: '7000000000000000000000000',
    accessControlManagerAddress: null,
    supplierCount: '1',
    borrowerCount: '0',
    __typename: 'Market',
  },
  {
    id: '0xdFdE6B33f13de2CA1A75A6F7169f50541B14f75b',
    pool: {
      id: '0x02df3a3F960393F5B349E40A599FEda91a7cc1A7',
      __typename: 'Pool',
    },
    badDebtMantissa: '0',
    borrowRateMantissa: '951293759',
    cashMantissa: '10000000000000000000',
    collateralFactorMantissa: '600000000000000000',
    exchangeRateMantissa: '10000000000000000000000000000',
    interestRateModelAddress: '0x5133BBdfCCa3Eb4F739D599ee4eC45cBCD0E16c5',
    name: 'Venus stkBNB',
    reservesMantissa: '0',
    supplyRateMantissa: '0',
    symbol: 'vstkBNB',
    underlyingAddress: '0xab16A69A5a8c12C732e0DEFF4BE56A70bb64c926',
    underlyingName: 'MockstkBNB',
    underlyingSymbol: 'MockstkBNB',
    borrowCapMantissa: '324000000000000000000',
    accrualBlockNumber: 379,
    blockTimestamp: 1706290556,
    borrowIndexMantissa: '1000000080859969515',
    reserveFactorMantissa: '250000000000000000',
    underlyingPriceCentsMantissa: '159000000000000000000',
    underlyingDecimals: 18,
    supplyCapMantissa: '1963000000000000000000',
    accessControlManagerAddress: null,
    supplierCount: '1',
    borrowerCount: '0',
    __typename: 'Market',
  },
  {
    id: '0x63fea6E447F120B8Faf85B53cdaD8348e645D80E',
    pool: {
      id: '0x02df3a3F960393F5B349E40A599FEda91a7cc1A7',
      __typename: 'Pool',
    },
    badDebtMantissa: '0',
    borrowRateMantissa: '951293759',
    cashMantissa: '10000000000000000000',
    collateralFactorMantissa: '600000000000000000',
    exchangeRateMantissa: '10000000000000000000000000000',
    interestRateModelAddress: '0x5133BBdfCCa3Eb4F739D599ee4eC45cBCD0E16c5',
    name: 'Venus RACA',
    reservesMantissa: '0',
    supplyRateMantissa: '0',
    symbol: 'vRACA',
    underlyingAddress: '0x5bf5b11053e734690269C6B9D438F8C9d48F528A',
    underlyingName: 'MockRACA',
    underlyingSymbol: 'MockRACA',
    borrowCapMantissa: '3805812642000000000000000000',
    accrualBlockNumber: 375,
    blockTimestamp: 1706290552,
    borrowIndexMantissa: '1000000078957381997',
    reserveFactorMantissa: '250000000000000000',
    underlyingPriceCentsMantissa: '159000000000000000000',
    underlyingDecimals: 18,
    supplyCapMantissa: '23758811062000000000000000000',
    accessControlManagerAddress: null,
    supplierCount: '1',
    borrowerCount: '0',
    __typename: 'Market',
  },
  {
    id: '0x12Bcb546bC60fF39F1Adfc7cE4605d5Bd6a6A876',
    pool: {
      id: '0x02df3a3F960393F5B349E40A599FEda91a7cc1A7',
      __typename: 'Pool',
    },
    badDebtMantissa: '0',
    borrowRateMantissa: '951293759',
    cashMantissa: '10000000000000000000',
    collateralFactorMantissa: '600000000000000000',
    exchangeRateMantissa: '10000000000000000000000000000',
    interestRateModelAddress: '0x5133BBdfCCa3Eb4F739D599ee4eC45cBCD0E16c5',
    name: 'Venus ankrBNB',
    reservesMantissa: '0',
    supplyRateMantissa: '0',
    symbol: 'vankrBNB',
    underlyingAddress: '0x34B40BA116d5Dec75548a9e9A8f15411461E8c70',
    underlyingName: 'MockankrBNB',
    underlyingSymbol: 'MockankrBNB',
    borrowCapMantissa: '100000000000000000000',
    accrualBlockNumber: 363,
    blockTimestamp: 1706290540,
    borrowIndexMantissa: '1000000073249619443',
    reserveFactorMantissa: '250000000000000000',
    underlyingPriceCentsMantissa: '159000000000000000000',
    underlyingDecimals: 18,
    supplyCapMantissa: '100000000000000000000',
    accessControlManagerAddress: null,
    supplierCount: '1',
    borrowerCount: '0',
    __typename: 'Market',
  },
  {
    id: '0xeF31027350Be2c7439C1b0BE022d49421488b72C',
    pool: {
      id: '0x02df3a3F960393F5B349E40A599FEda91a7cc1A7',
      __typename: 'Pool',
    },
    badDebtMantissa: '0',
    borrowRateMantissa: '0',
    cashMantissa: '10000000000000000000',
    collateralFactorMantissa: '700000000000000000',
    exchangeRateMantissa: '10000000000000000000000000000',
    interestRateModelAddress: '0x8F4ec854Dd12F1fe79500a1f53D0cbB30f9b6134',
    name: 'Venus ANKR',
    reservesMantissa: '0',
    supplyRateMantissa: '0',
    symbol: 'vANKR',
    underlyingAddress: '0xF8e31cb472bc70500f08Cd84917E5A1912Ec8397',
    underlyingName: 'MockANKR',
    underlyingSymbol: 'MockANKR',
    borrowCapMantissa: '3000000000000000000000000',
    accrualBlockNumber: 359,
    blockTimestamp: 1706290536,
    borrowIndexMantissa: '1000000000000000000',
    reserveFactorMantissa: '250000000000000000',
    underlyingPriceCentsMantissa: '159000000000000000000',
    underlyingDecimals: 18,
    supplyCapMantissa: '3000000000000000000000000',
    accessControlManagerAddress: null,
    supplierCount: '1',
    borrowerCount: '0',
    __typename: 'Market',
  },
];

export const defaultPools = [
  {
    id: '0x02df3a3F960393F5B349E40A599FEda91a7cc1A7',
    name: 'Pool 2',
    creator: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    blockPosted: '255',
    timestampPosted: '1706291642',
    category: '',
    logoUrl: '',
    description: '',
    priceOracleAddress: '0x7a2088a1bFc9d81c55368AE168C2C02570cB814F',
    closeFactorMantissa: '600000000000000000',
    liquidationIncentiveMantissa: '3000000000000000000',
    minLiquidatableCollateralMantissa: '200000000000000000000',
    markets: defaultMarkets.slice(0, 2),
    __typename: 'Pool',
  },
  {
    id: '0x413b1AfCa96a3df5A686d8BFBF93d30688a7f7D9',
    name: 'Pool 1',
    creator: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    blockPosted: '253',
    timestampPosted: '1706291640',
    category: '',
    logoUrl: '',
    description: '',
    priceOracleAddress: '0x7a2088a1bFc9d81c55368AE168C2C02570cB814F',
    closeFactorMantissa: '50000000000000000',
    liquidationIncentiveMantissa: '1000000000000000000',
    minLiquidatableCollateralMantissa: '100000000000000000000',
    markets: defaultMarkets.slice(2, defaultMarkets.length),
    __typename: 'Pool',
  },
];
