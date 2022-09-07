# Venus-Subgraph

[Venus](https://venus.io/) is an open-source protocol for algorithmic, efficient Money Markets on the Binance Smart Chain. This Subgraph ingests the contracts of Venus protocol.

## Networks and Performance

This subgraph can be found on The Graph Hosted Service at https://thegraph.com/explorer/subgraph/venusprotocol/venus-subgraph.

You can also run this subgraph locally, if you wish. Instructions for that can be found in [The Graph Documentation](https://thegraph.com/docs/en/developer/quick-start/).

### ABI

The ABI used is `vtoken.json`. It is a stripped down version of the full abi provided by Venus, that satisfies the calls we need to make for both vBNB and vBEP20 contracts. This way we can use 1 ABI file, and one mapping for vBNB and vBEP20.

## Getting started with querying

Below are a few ways to show how to query the Venus V2 Subgraph for data. The queries show most of the information that is queryable, but there are many other filtering options that can be used, just check out the [querying api](https://github.com/graphprotocol/graph-node/blob/master/docs/graphql-api.md).

You can also see the saved queries on the hosted service for examples.