#!/bin/bash

version=($(jq -r '.version' package.json))
alchemy_node=https://subgraphs.alchemy.com/api/subgraphs/deploy
alchemy_ipfs=https://ipfs.satsuma.xyz

if [[ $version == *"testnet"* ]]; then
  yarn deploy:chapel --node $alchemy_node --ipfs $alchemy_ipfs --version-label $version --deploy-key $TESTNET_GRAPH_CLI_ALCHEMY_KEY
else
  yarn graph auth --studio $MAINNET_GRAPH_CLI_API_KEY
  yarn deploy:bsc --version-label $version
fi



