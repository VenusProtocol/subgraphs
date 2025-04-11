#!/bin/bash

version=($(jq -r '.version' package.json))

if [[ $version == *"testnet"* ]]; then
  yarn deploy:sepolia --node https://subgraphs.alchemy.com/api/subgraphs/deploy --ipfs https://ipfs.satsuma.xyz --version-label $version --deploy-key $TESTNET_GRAPH_CLI_ALCHEMY_KEY
else
  yarn deploy:bsc --node https://subgraphs.alchemy.com/api/subgraphs/deploy --ipfs https://ipfs.satsuma.xyz --version-label $version --deploy-key $MAINNET_GRAPH_CLI_ALCHEMY_KEY
  yarn deploy:ethereum --node https://subgraphs.alchemy.com/api/subgraphs/deploy --ipfs https://ipfs.satsuma.xyz --version-label $version --deploy-key $MAINNET_GRAPH_CLI_ALCHEMY_KEY
  yarn deploy:arbitrum --node https://subgraphs.alchemy.com/api/subgraphs/deploy --ipfs https://ipfs.satsuma.xyz --version-label $version --deploy-key $MAINNET_GRAPH_CLI_ALCHEMY_KEY
fi



