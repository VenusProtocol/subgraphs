#! /bin/sh
# For convience we are going to copy contracts and artifacts locally so they can be 

rm -rf ./contracts
mkdir -p ./contracts/isolated-pools
cp -rf ./node_modules/@venusprotocol/isolated-pools/contracts/ ./contracts/isolated-pools/contracts

mkdir -p ./contracts/oracle
cp -rf ./node_modules/@venusprotocol/oracle/contracts/ ./contracts/oracle/contracts
