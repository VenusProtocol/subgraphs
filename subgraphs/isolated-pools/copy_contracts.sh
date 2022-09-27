# For convience we are going to copy contracts and artifacts locally so they can be 

rm -rf ./contracts
mkdir -p contracts/oracle
mkdir -p contracts/isolated-pools
cp -rf ../../node_modules/@venusprotocol/oracle/contracts/ ./contracts/oracle/contracts
cp -rf ../../node_modules/@venusprotocol/isolated-pools/contracts/ ./contracts/isolated-pools/contracts

rm -rf ./artifacts
mkdir -p artifacts/oracle
mkdir -p artifacts/isolated-pools
cp -rf ../../node_modules/@venusprotocol/oracle/artifacts/ ./artifacts/oracle/artifacts
cp -rf ../../node_modules/@venusprotocol/isolated-pools/artifacts/ ./artifacts/isolated-pools/artifacts
