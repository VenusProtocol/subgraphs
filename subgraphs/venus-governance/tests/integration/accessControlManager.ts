import '@nomiclabs/hardhat-ethers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import subgraphClient from '../../subgraph-client/index';
import { SYNC_DELAY } from './utils/constants';

describe('AccessControlManager', function () {
  before(async function () {
    await waitForSubgraphToBeSynced(SYNC_DELAY);
  });

  describe('Permission events', function () {
    it('indexes permission granted events', async function () {
      const { data } = await subgraphClient.getPermissions();

      const { permissions } = data!;
      expect(permissions.length).to.be.equal(12);

      permissions.forEach(pe => {
        expect(pe.type).to.be.equal('GRANTED');
      });
    });

    it('indexes permission revoked events', async function () {
      const accessControlManager = await ethers.getContract('AccessControlManager');
      const tx = await accessControlManager.revokeCallPermission(
        ethers.constants.AddressZero,
        'setMinLiquidatableCollateral(uint256)',
        ethers.constants.AddressZero,
      );
      await tx.wait();
      await waitForSubgraphToBeSynced(SYNC_DELAY);

      const { data } = await subgraphClient.getPermissions();

      const { permissions } = data!;
      expect(permissions.length).to.be.equal(13);

      expect(permissions[0].type).to.be.equal('REVOKED');
    });

    it('updates a previously created record with a new permission type', async function () {
      const accessControlManager = await ethers.getContract('AccessControlManager');
      const tx = await accessControlManager.giveCallPermission(
        ethers.constants.AddressZero,
        'setMinLiquidatableCollateral(uint256)',
        ethers.constants.AddressZero,
      );
      await tx.wait();
      await waitForSubgraphToBeSynced(SYNC_DELAY);

      const { data } = await subgraphClient.getPermissions();

      const { permissions } = data!;
      expect(permissions.length).to.be.equal(13);

      expect(permissions[0].type).to.be.equal('GRANTED');
    });
  });
});
