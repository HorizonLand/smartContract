import { assert, expect } from 'chai'
import { ethers } from 'hardhat'
import { Billiard721 } from 'types'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Land } from 'types'
let Chance = require('chance')
describe('Boom arena contract', function () {
  var chance = new Chance()
  let [owner, minter, member]: SignerWithAddress[] = []
  let land: Land
  beforeEach(async () => {
    ;[owner, minter, member] = await ethers.getSigners()
    const Land = await ethers.getContractFactory('Land')
    land = await Land.deploy()
    await land.deployed()
    await land.grantRole('0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6', minter.address)
  })
  describe('#mint', async () => {
    it('should revert if not owner', async function () {
      await expect(land.connect(member).mintNFT(member.address, 1)).to.be.revertedWith('AccessControl: account')
    })
    it('should mint successfully', async function () {
      const mintTx = await land.connect(minter).mintNFT(member.address, 1)
      expect(await land.balanceOf(member.address)).to.be.equal(1)
      await expect(mintTx).to.be.emit(land, 'LandMinted').withArgs(1, 0, 1)
    })
  })
  describe('decode - encode', async () => {
    it('should decode with correct value', async function () {
      for (let i = 0; i < 100; i++) {
        let x = chance.integer({ min: 0, max: 1000 })
        let y = chance.integer({ min: 0, max: 1000 })
        let encoded = await land.encodeTokenId(x, y)
        expect((await land.decodeTokenId(encoded))[0]).to.be.equal(x)
        expect((await land.decodeTokenId(encoded))[1]).to.be.equal(y)
      }
    })
  })
})
