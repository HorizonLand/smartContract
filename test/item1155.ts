import { BigNumber, BigNumberish } from 'ethers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { MarketToken, Item1155 } from 'types'

describe('Marketplace ', () => {
  let item: Item1155
  let marketToken: MarketToken
  let [owner, buyer, minter]: SignerWithAddress[] = []
  let uri: string = 'uri.com/'
  let balanceBuyer: BigNumber = ethers.utils.parseUnits('10000000', 'ether')
  let balanceOwner: BigNumber
  let priceItemDefault: BigNumber = ethers.utils.parseUnits('100', 'ether')
  beforeEach(async () => {
    ;[owner, buyer, minter] = await ethers.getSigners()
    const Token = await ethers.getContractFactory('MarketToken')
    marketToken = await Token.deploy()
    const tokenAddress = marketToken.address
    const Item1155 = await ethers.getContractFactory('Item1155')
    item = await Item1155.deploy(tokenAddress)
    await item.deployed()
    await marketToken.transfer(buyer.address, balanceBuyer)
    await marketToken.connect(buyer).approve(item.address, balanceBuyer)
    await item.grantRole('0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6', minter.address)
    balanceOwner = await marketToken.balanceOf(owner.address)
  })
  describe('#setUri', () => {
    it('revert if not owner', async function () {
      await expect(item.connect(buyer).setUri(uri)).to.be.revertedWith('AccessControl: account')
    })
    it('should set uri successfully', async function () {
      await item.setUri(uri)
      expect(await item.uri(1)).to.be.equal(uri)
    })
  })
  describe('#updateRankInfo', () => {
    it('revert if not owner', async function () {
      await expect(item.connect(buyer).updateRankInfo(1, 10)).to.be.revertedWith('AccessControl: account')
    })
    it('revert if quantity = 0', async function () {
      await expect(item.updateRankInfo(1, 0)).to.be.revertedWith('Item1155: quantity must greater than 0')
    })
    it('update rank info successfully', async function () {
      const updateTx = await item.updateRankInfo(1, 5)
      await expect(updateTx).to.be.emit(item, 'RankInfoUpdated').withArgs(1, 5)
      expect(await item._rankToQuantity(1)).to.be.equal(5)
    })
  })
  describe('#removeRankInfo', () => {
    it('revert if not owner', async function () {
      await expect(item.connect(buyer).removeRankInfo(1)).to.be.revertedWith('AccessControl: account')
    })
    it('remove successfully', async function () {
      await item.updateRankInfo(1, 5)
      const removeTx = await item.removeRankInfo(1)
      await expect(removeTx).to.be.emit(item, 'RankInfoUpdated').withArgs(1, 0)
      expect(await item._rankToQuantity(1)).to.be.equal(0)
    })
  })
  describe('#mintItem', () => {
    it('revert if not minter role', async function () {
      await expect(item.connect(buyer).mintItem(1, 1, priceItemDefault)).to.be.revertedWith('AccessControl: account')
    })
    it('revert if rankInfo not exist', async function () {
      await expect(item.mintItem(1, 1, priceItemDefault)).to.be.revertedWith('Item: invalid rank')
    })
    it('revert if price = 0', async function () {
      await item.updateRankInfo(1, 5)
      await expect(item.mintItem(1, 1, 0)).to.be.revertedWith('Item: invalid price')
    })
    it('revert if type id > 2', async function () {
      await item.updateRankInfo(1, 5)
      await expect(item.mintItem(3, 1, priceItemDefault)).to.be.revertedWith('Item: invalid typeId')
    })
    it('mint successfully', async function () {
      await item.updateRankInfo(1, 5)
      const mintTx = await item.connect(minter).mintItem(1, 1, priceItemDefault)
      expect(mintTx).to.be.emit(item, 'Itemcreated').withArgs(1, minter.address, 1, 1, priceItemDefault, 5)
      expect((await item._tokenIdToItem(1)).typeId).to.be.equal(1)
      expect((await item._tokenIdToItem(1)).rank).to.be.equal(1)
      expect((await item._tokenIdToItem(1)).price).to.be.equal(priceItemDefault)
    })
  })
  describe('#buyItem', () => {
    beforeEach(async () => {
      await item.updateRankInfo(1, 5)
      await item.connect(minter).mintItem(1, 1, priceItemDefault)
    })
    it('revert if quantity = 0', async function () {
      await expect(item.connect(buyer).buyItem(1, 0)).to.be.revertedWith('Item1155: quantity must greater than 0')
    })
    it('revert if quantity > token balance', async function () {
      await expect(item.connect(buyer).buyItem(1, 6)).to.be.revertedWith('Item1155: item limited')
    })
    it('revert if token not exist', async function () {
      await expect(item.connect(buyer).buyItem(2, 6)).to.be.revertedWith('Item1155: item limited')
    })
    it('buy item successfully', async function () {
      const buyTx = await item.connect(buyer).buyItem(1, 5)
      await expect(buyTx).to.be.emit(item, 'ItemBought').withArgs(1, buyer.address, priceItemDefault.mul(5), 5)
      expect(await marketToken.balanceOf(buyer.address)).to.be.equal(balanceBuyer.sub(priceItemDefault.mul(5)))
      expect(await marketToken.balanceOf(item.address)).to.be.equal(priceItemDefault.mul(5))
      expect(await item.balanceOf(buyer.address, 1)).to.be.equal(5)
    })
  })
  describe('#withdrawToken', () => {
    beforeEach(async () => {
      await item.updateRankInfo(1, 5)
      await item.connect(minter).mintItem(1, 1, priceItemDefault)
      await item.connect(buyer).buyItem(1, 5)
    })
    it('revert if not owner', async function () {
      await expect(item.connect(buyer).withdrawToken(marketToken.address, owner.address, priceItemDefault)).to.be.revertedWith('AccessControl: account')
    })
    it('revet if not enough token', async function () {
      await expect(item.withdrawToken(marketToken.address, owner.address, priceItemDefault.mul(5).add(1))).to.be.revertedWith('Item: not enough balance')
    })
    it('withdraw successfully', async function () {
      item.withdrawToken(marketToken.address, owner.address, priceItemDefault.mul(5))
      expect(await marketToken.balanceOf(owner.address)).to.be.equal(balanceOwner.add(priceItemDefault.mul(5)))
    })
  })
})
