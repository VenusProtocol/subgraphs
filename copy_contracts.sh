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

mkdir -p ./contracts/protocol
cp -rf ./node_modules/@venusprotocol/venus-protocol/contracts/ ./contracts/protocol/contracts
rm -rf contracts/protocol/contracts/test

mkdir -p ./contracts/protocol-reserve
cp -rf ./node_modules/@venusprotocol/protocol-reserve/contracts/ ./contracts/protocol-reserve/contracts
rm -rf contracts/protocol-reserve/contracts/Test

mkdir -p ./contracts/governance/contracts/Governance
mkdir -p ./contracts/governance/contracts/legacy
mkdir -p ./contracts/governance/contracts/test

cp -rf ./node_modules/@venusprotocol/governance-contracts/contracts/legacy ./contracts/governance/contracts
cp ./node_modules/@venusprotocol/governance-contracts/contracts/test/TestTimelockV8.sol ./contracts/governance/contracts/test/TestTimelockV8.sol
cp ./node_modules/@venusprotocol/governance-contracts/contracts/Governance/GovernorBravoInterfaces.sol ./contracts/governance/contracts/Governance/GovernorBravoInterfaces.sol
cp ./node_modules/@venusprotocol/governance-contracts/contracts/Governance/TimelockV8.sol ./contracts/governance/contracts/Governance/TimelockV8.sol

rm -rf contracts/protocol/contracts/Lens/VenusLens.sol

mkdir -p ./contracts/mocks
cp -rf ./mocks/ ./contracts/mocks/contracts
