#! /bin/sh
# For convience we are going to copy contracts and artifacts locally so they can be
# Make sure packages are patched properly
yarn patch-package

rm -rf ./contracts
mkdir -p ./contracts/isolated-pools
cp -r ./node_modules/@venusprotocol/isolated-pools/contracts/ ./contracts/isolated-pools/contracts
rm -rf contracts/isolated-pools/contracts/test

mkdir -p ./contracts/oracle
cp -r ./node_modules/@venusprotocol/oracle/contracts/ ./contracts/oracle/contracts
rm -rf contracts/oracle/contracts/test
rm ./contracts/oracle/contracts/ResilientOracle.sol

mkdir -p ./contracts/protocol
cp -rf ./node_modules/@venusprotocol/venus-protocol/contracts/ ./contracts/protocol/contracts
rm -rf contracts/protocol/contracts/DelegateBorrowers/*
rm -rf contracts/protocol/contracts/Swap/*
rm -rf contracts/protocol/contracts/Liquidator/*
rm -rf contracts/protocol/contracts/test/*
cp -p ./node_modules/@venusprotocol/venus-protocol/contracts/test/ComptrollerMock.sol ./contracts/protocol/contracts/test/ComptrollerMock.sol
cp -p ./node_modules/@venusprotocol/venus-protocol/contracts/test/MockToken.sol ./contracts/protocol/contracts/test/MockToken.sol

mkdir -p ./contracts/protocol-reserve
cp -r ./node_modules/@venusprotocol/protocol-reserve/contracts/ ./contracts/protocol-reserve/contracts
rm -rf contracts/protocol-reserve/contracts/Test

mkdir -p ./contracts/governance/contracts/Governance
mkdir -p ./contracts/governance/contracts/legacy
mkdir -p ./contracts/governance/contracts/test

cp -r ./node_modules/@venusprotocol/governance-contracts/contracts/legacy ./contracts/governance/contracts
cp ./node_modules/@venusprotocol/governance-contracts/contracts/test/TestTimelockV8.sol ./contracts/governance/contracts/test/TestTimelockV8.sol
cp -r ./node_modules/@venusprotocol/governance-contracts/contracts/Governance ./contracts/governance/contracts
cp -r ./node_modules/@venusprotocol/governance-contracts/contracts/Cross-chain ./contracts/governance/contracts
rm ./contracts/governance/contracts/Governance/AccessControlManager.sol
rm ./contracts/governance/contracts/Governance/Timelock.sol


# Copy crosschain contracts
mkdir -p ./contracts/governance/contracts/Cross-chain
cp -rf ./node_modules/@venusprotocol/cross-chain-governance-contracts/contracts/Cross-chain ./contracts/governance/contracts/

mkdir -p ./contracts/mocks
cp -rf ./mocks/ ./contracts/mocks/contracts
mv ./contracts/mocks/contracts/VBep20DelegateR1.sol ./contracts/protocol/contracts/Tokens/VTokens/legacy/VBep20DelegateR1.sol
mv ./contracts/mocks/contracts/VBep20DelegatorR1.sol ./contracts/protocol/contracts/Tokens/VTokens/legacy/VBep20DelegatorR1.sol

mkdir -p ./contracts/utilities
cp -rf ./node_modules/@venusprotocol/solidity-utilities/contracts ./contracts/utilities
