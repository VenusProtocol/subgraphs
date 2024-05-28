import '@nomiclabs/hardhat-ethers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { waitForSubgraphToBeSynced } from 'venus-subgraph-utils';

import subgraphClient from '../../subgraph-client/index';
import { SYNC_DELAY, nullAddress } from './utils/constants';

const functionSig = 'swapPoolsAssets(address[],uint256[],address[][])';
const account = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';

describe('AccessControlManager', function () {
  before(async function () {
    await waitForSubgraphToBeSynced(SYNC_DELAY);
  });

  describe('Permission events', function () {
    it('indexes permission granted events', async function () {
      const { data } = await subgraphClient.getPermissions();

      const { permissions } = data!;
      expect(permissions.length).to.be.equal(32);

      permissions.forEach(pe => {
        expect(pe.status).to.be.equal('GRANTED');
      });
    });

    it('indexes permission revoked events', async function () {
      const accessControlManager = await ethers.getContract('AccessControlManager');
      const tx = await accessControlManager.revokeCallPermission(
        ethers.constants.AddressZero,
        functionSig,
        account,
      );
      await tx.wait();
      await waitForSubgraphToBeSynced(SYNC_DELAY);

      const { data } = await subgraphClient.getPermissions();
      const { permissions } = data!;
      expect(permissions.length).to.be.equal(32);

      const { data: permissionByIdData } = await subgraphClient.getPermission(
        `${account}-${nullAddress}-${functionSig}`,
      );

      const { permission } = permissionByIdData!;
      expect(permission.status).to.be.equal('REVOKED');
    });

    it('updates a previously created record with a new permission type', async function () {
      const accessControlManager = await ethers.getContract('AccessControlManager');
      const tx = await accessControlManager.giveCallPermission(
        ethers.constants.AddressZero,
        functionSig,
        account,
      );
      await tx.wait();
      await waitForSubgraphToBeSynced(SYNC_DELAY);

      const { data } = await subgraphClient.getPermissions();

      const { permissions } = data!;
      expect(permissions.length).to.be.equal(32);
      const { data: permissionByIdData } = await subgraphClient.getPermission(
        `${account}-${nullAddress}-${functionSig}`,
      );

      const { permission } = permissionByIdData!;
      expect(permission.status).to.be.equal('GRANTED');
    });
  });
});
