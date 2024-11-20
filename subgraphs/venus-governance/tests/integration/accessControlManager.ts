import '@nomiclabs/hardhat-ethers';
import { waitForSubgraphToBeSynced } from '@venusprotocol/subgraph-utils';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';

import subgraphClient from '../../subgraph-client/index';
import { SYNC_DELAY, nullAddress } from './utils/constants';

const functionSig = 'setup(uint16,bytes)';
const account = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';

const getPermissionId = (account: string, contract: string, functionSig: string) => {
  const role = ethers.utils.solidityKeccak256(['address', 'string'], [contract, functionSig]);
  return `${account}${role.replace('0x', '')}`;
};

describe('AccessControlManager', function () {
  let accessControlManager: Contract;
  let governorBravoDelegator: Contract;

  before(async function () {
    accessControlManager = await ethers.getContract('AccessControlManager');
    governorBravoDelegator = await ethers.getContract('GovernorBravoDelegator');
    await waitForSubgraphToBeSynced(SYNC_DELAY);
  });

  describe('Permission events', function () {
    it('indexes permission granted events', async function () {
      const {
        data: { permissions: allPermissions },
      } = await subgraphClient.getPermissions();

      expect(allPermissions.length).to.be.equal(46);
      allPermissions.forEach((pe) => {
        expect(pe.status).to.be.equal('GRANTED');
      });

      const tx1 = await accessControlManager.giveCallPermission(ethers.constants.AddressZero, functionSig, account);

      const tx2 = await accessControlManager.giveCallPermission(governorBravoDelegator.address, functionSig, account);

      await waitForSubgraphToBeSynced(SYNC_DELAY);

      const {
        data: { permission: openSetupPermission },
      } = await subgraphClient.getPermission(getPermissionId(account, nullAddress, functionSig));

      expect(openSetupPermission.createdAt).to.be.equal(tx1.hash);
      expect(openSetupPermission.updatedAt).to.be.equal(tx1.hash);
      expect(openSetupPermission.role).to.be.equal(ethers.utils.solidityKeccak256(['address', 'string'], [ethers.constants.AddressZero, functionSig]));
      expect(openSetupPermission.accountAddress).to.be.equal(account);
      expect(openSetupPermission.status).to.be.equal('GRANTED');

      const {
        data: { permission: bravoSetupPermission },
      } = await subgraphClient.getPermission(getPermissionId(account, governorBravoDelegator.address, functionSig));

      expect(bravoSetupPermission.createdAt).to.be.equal(tx2.hash);
      expect(bravoSetupPermission.updatedAt).to.be.equal(tx2.hash);
      expect(bravoSetupPermission.role).to.be.equal(ethers.utils.solidityKeccak256(['address', 'string'], [governorBravoDelegator.address, functionSig]));
      expect(openSetupPermission.accountAddress).to.be.equal(account);
      expect(bravoSetupPermission.status).to.be.equal('GRANTED');

      const {
        data: { permissions },
      } = await subgraphClient.getPermissions();
      expect(permissions.length).to.be.equal(48);
    });

    it('indexes permission revoked events', async function () {
      const accessControlManager = await ethers.getContract('AccessControlManager');
      const tx = await accessControlManager.revokeCallPermission(ethers.constants.AddressZero, functionSig, account);
      await tx.wait();
      await waitForSubgraphToBeSynced(SYNC_DELAY);

      const { data } = await subgraphClient.getPermissions();
      const { permissions } = data!;
      expect(permissions.length).to.be.equal(48);

      const { data: permissionByIdData } = await subgraphClient.getPermission(getPermissionId(account, nullAddress, functionSig));
      const { permission } = permissionByIdData!;
      expect(permission.updatedAt).to.be.equal(tx.hash);
      expect(permission.status).to.be.equal('REVOKED');
    });
  });
});
