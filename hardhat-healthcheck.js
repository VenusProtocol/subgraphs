#!/usr/bin/env node

/**
 * If node is up this function will silently succeed. If the node is down it will throw an error.
 */
async function healthCheck() {
  const ethers = require('ethers');
  const localProvider = new ethers.providers.JsonRpcProvider(`http://hardhat:8545`)
  localBlockNum = await localProvider.getBlockNumber();
}

module.export = healthCheck();
