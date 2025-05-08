#!/bin/bash

version=($(jq -r '.version' package.json))
alchemy_node=https://subgraphs.alchemy.com/api/subgraphs/deploy
alchemy_ipfs=https://ipfs.satsuma.xyz

yarn

if [[ $version == *"testnet"* ]]; then
  yarn deploy:sepolia --node $alchemy_node --ipfs $alchemy_ipfs --version-label $version --deploy-key $TESTNET_GRAPH_CLI_ALCHEMY_KEY
  # opBNB is not supported in either Alchemy or The Graph
  yarn deploy:arbitrumSepolia --node $alchemy_node --ipfs $alchemy_ipfs --version-label $version --deploy-key $TESTNET_GRAPH_CLI_ALCHEMY_KEY
  yarn deploy:zksyncSepolia --node $alchemy_node --ipfs $alchemy_ipfs --version-label $version --deploy-key $TESTNET_GRAPH_CLI_ALCHEMY_KEY
  yarn deploy:optimismSepolia --node $alchemy_node --ipfs $alchemy_ipfs --version-label $version --deploy-key $TESTNET_GRAPH_CLI_ALCHEMY_KEY
  yarn deploy:baseSepolia --node $alchemy_node --ipfs $alchemy_ipfs --version-label $version --deploy-key $TESTNET_GRAPH_CLI_ALCHEMY_KEY
  yarn deploy:unichainSepolia --node $alchemy_node --ipfs $alchemy_ipfs --version-label $version --deploy-key $TESTNET_GRAPH_CLI_ALCHEMY_KEY
  yarn graph auth --studio $TESTNET_GRAPH_CLI_API_KEY
  yarn deploy:berachainBepolia --studio --version-label $version
else
  yarn graph auth --studio $MAINNET_GRAPH_CLI_API_KEY
  yarn deploy:bsc --version-label $version
  yarn deploy:ethereum --version-label $version
  yarn deploy:arbitrum --version-label $version
  yarn deploy:optimism --version-label $version
  yarn deploy:zkSync --version-label $version
fi

