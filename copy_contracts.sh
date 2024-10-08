#! /bin/sh
# For convience we are going to copy contracts and artifacts locally so they can be
# Make sure packages are patched properly
yarn patch-package

rm -rf ./contracts
mkdir -p ./contracts/isolated-pools
cp -r ./node_modules/@venusprotocol/isolated-pools/contracts/ ./contracts/isolated-pools/contracts
rm -rf contracts/isolated-pools/contracts/test
rm -rf contracts/isolated-pools/contracts/Gateway

mkdir -p ./contracts/oracle/contracts/interfaces
mkdir -p ./contracts/oracle/contracts/oracles/mocks
cp ./node_modules/@venusprotocol/oracle/contracts/interfaces/OracleInterface.sol ./contracts/oracle/contracts/interfaces/OracleInterface.sol
cp ./node_modules/@venusprotocol/oracle/contracts/interfaces/VBep20Interface.sol ./contracts/oracle/contracts/interfaces/VBep20Interface.sol
cp ./node_modules/@venusprotocol/oracle/contracts/oracles/BoundValidator.sol ./contracts/oracle/contracts/oracles/BoundValidator.sol
cp ./node_modules/@venusprotocol/oracle/contracts/oracles/PythOracle.sol ./contracts/oracle/contracts/oracles/PythOracle.sol
cp ./node_modules/@venusprotocol/oracle/contracts/interfaces/PythInterface.sol ./contracts/oracle/contracts/interfaces/PythInterface.sol
cp ./node_modules/@venusprotocol/oracle/contracts/oracles/mocks/MockChainlinkOracle.sol ./contracts/oracle/contracts/oracles/mocks/MockChainlinkOracle.sol
cp ./node_modules/@venusprotocol/oracle/contracts/oracles/mocks/MockPythOracle.sol ./contracts/oracle/contracts/oracles/mocks/MockPythOracle.sol
cp ./node_modules/@venusprotocol/oracle/contracts/oracles/mocks/MockBinanceOracle.sol ./contracts/oracle/contracts/oracles/mocks/MockBinanceOracle.sol


mkdir -p ./contracts/protocol
cp -rf ./node_modules/@venusprotocol/venus-protocol/contracts/ ./contracts/protocol/contracts
rm -rf contracts/protocol/contracts/DelegateBorrowers/*
rm -rf contracts/protocol/contracts/Swap/*
rm -rf contracts/protocol/contracts/Liquidator/*
rm -rf contracts/protocol/contracts/test/*
cp -p ./node_modules/@venusprotocol/venus-protocol/contracts/test/ComptrollerMock.sol ./contracts/protocol/contracts/test/ComptrollerMock.sol
cp -p ./node_modules/@venusprotocol/venus-protocol/contracts/test/MockToken.sol ./contracts/protocol/contracts/test/MockToken.sol

# Remove extra contracts
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
cp -rf ./node_modules/@venusprotocol/governance-contracts/contracts/Cross-chain ./contracts/governance/contracts/

mkdir -p ./contracts/mocks
cp -rf ./mocks/ ./contracts/mocks/contracts
mv ./contracts/mocks/contracts/VBep20DelegateR1.sol ./contracts/protocol/contracts/Tokens/VTokens/legacy/VBep20DelegateR1.sol
mv ./contracts/mocks/contracts/VBep20DelegatorR1.sol ./contracts/protocol/contracts/Tokens/VTokens/legacy/VBep20DelegatorR1.sol

mkdir -p ./contracts/utilities
cp -rf ./node_modules/@venusprotocol/solidity-utilities/contracts ./contracts/utilities
rm -rf ./node_modules/@venusprotocol/solidity-utilities/contracts/test

mkdir -p ./contracts/layerzero/mocks
mkdir -p ./contracts/layerzero/interfaces
mkdir -p ./contracts/layerzero/libs
cp ./node_modules/@layerzerolabs/solidity-examples/contracts/lzApp/mocks/LZEndpointMock.sol ./contracts/layerzero/mocks/LZEndpointMock.sol
cp ./node_modules/@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroReceiver.sol ./contracts/layerzero/interfaces/ILayerZeroReceiver.sol
cp ./node_modules/@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroEndpoint.sol ./contracts/layerzero/interfaces/ILayerZeroEndpoint.sol
cp ./node_modules/@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroUserApplicationConfig.sol ./contracts/layerzero/interfaces/ILayerZeroUserApplicationConfig.sol
cp ./node_modules/@layerzerolabs/solidity-examples/contracts/lzApp/libs/LzLib.sol ./contracts/layerzero/libs/LzLib.sol
