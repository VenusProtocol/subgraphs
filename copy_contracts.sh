#! /bin/sh
# For convience we are going to copy contracts and artifacts locally so they can be
# Make sure packages are patched properly
yarn patch-package

rm -rf ./contracts
mkdir -p ./contracts/isolated-pools
cp -rf ./node_modules/@venusprotocol/isolated-pools/contracts/ ./contracts/isolated-pools/contracts
rm -rf contracts/isolated-pools/contracts/test

mkdir -p ./contracts/oracle
cp -rf ./node_modules/@venusprotocol/oracle/contracts/ ./contracts/oracle/contracts
rm -rf contracts/oracle/contracts/test
rm ./contracts/oracle/contracts/ResilientOracle.sol

mkdir -p ./contracts/protocol
cp -rf ./node_modules/@venusprotocol/venus-protocol/contracts/ ./contracts/protocol/contracts
# cp ./node_modules/@venusprotocol/governance-contracts/contracts/test/ComptrollerMock.sol ./contracts/governance/contracts/test/ComptrollerMock.sol


mkdir -p ./contracts/protocol-reserve
cp -rf ./node_modules/@venusprotocol/protocol-reserve/contracts/ ./contracts/protocol-reserve/contracts
rm -rf contracts/protocol-reserve/contracts/Test

mkdir -p ./contracts/governance/contracts/Governance
mkdir -p ./contracts/governance/contracts/legacy
mkdir -p ./contracts/governance/contracts/test

cp -rf ./node_modules/@venusprotocol/governance-contracts/contracts/legacy ./contracts/governance/contracts
cp ./node_modules/@venusprotocol/governance-contracts/contracts/test/TestTimelockV8.sol ./contracts/governance/contracts/test/TestTimelockV8.sol
cp -rf ./node_modules/@venusprotocol/governance-contracts/contracts/Governance ./contracts/governance/contracts
rm ./contracts/governance/contracts/Governance/AccessControlManager.sol
rm ./contracts/governance/contracts/Governance/Timelock.sol

mkdir -p ./contracts/mocks
cp -rf ./mocks/ ./contracts/mocks/contracts
