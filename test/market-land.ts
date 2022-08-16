import { BigNumber } from 'ethers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { MarketToken, Land, MarketHorizonLand } from 'types'
let Chance = require('chance')

describe('Marketplace ', () => {
  var chance = new Chance()
  let land: Land
  let market: MarketHorizonLand
  let marketToken: MarketToken
  let owner: SignerWithAddress
  let manager: SignerWithAddress
  let buyer1: SignerWithAddress
  let buyer2: SignerWithAddress
  let seller: SignerWithAddress
  let address0: String = '0x0000000000000000000000000000000000000000'
  let balanceOwner: BigNumber
  let balanceAddr1: BigNumber = ethers.utils.parseUnits('10000000', 'ether')
  let balanceAddr2: BigNumber = ethers.utils.parseUnits('10000000', 'ether')
  let balanceAddr3: BigNumber = ethers.utils.parseUnits('10000000', 'ether')
  let defaultX: BigNumber = BigNumber.from(chance.integer({ min: 0, max: 1000 }))
  let defaultY: BigNumber = BigNumber.from(chance.integer({ min: 0, max: 1000 }))
  let defaultX2: BigNumber = BigNumber.from(chance.integer({ min: 1000, max: 2000 }))
  let defaultY2: BigNumber = BigNumber.from(chance.integer({ min: 1000, max: 2000 }))
  let priceItemDefault: BigNumber = ethers.utils.parseUnits('100', 'ether')
  let amountOfferDefault: BigNumber = ethers.utils.parseUnits('50', 'ether')
  let encoded: BigNumber
  let encoded2: BigNumber
  beforeEach(async () => {
    ;[owner, manager, buyer1, buyer2, seller] = await ethers.getSigners()
    const Token = await ethers.getContractFactory('MarketToken')
    marketToken = await Token.deploy()
    const Land = await ethers.getContractFactory('Land')
    land = await Land.deploy()
    await land.deployed()
    await marketToken.transfer(buyer1.address, balanceAddr1)
    await marketToken.transfer(buyer2.address, balanceAddr2)
    await marketToken.transfer(seller.address, balanceAddr3)
    const MarketHorizonLand = await ethers.getContractFactory('MarketHorizonLand')
    market = await MarketHorizonLand.deploy(marketToken.address, manager.address, land.address)
    await market.deployed()
    await marketToken.connect(buyer1).approve(market.address, balanceAddr1)
    await marketToken.connect(buyer2).approve(market.address, balanceAddr2)
    await land.connect(seller).setApprovalForAll(market.address, true)
    balanceOwner = await marketToken.balanceOf(owner.address)
    encoded = await land.encodeTokenId(defaultX, defaultY)
    encoded2 = await land.encodeTokenId(defaultX2, defaultY2)
    await land.grantRole('0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6', market.address)
  })
  describe('#setPriceForTokenId', () => {
    it('revert if not admin', async function () {
      await expect(market.connect(buyer1).setPriceForTokenId(defaultX, defaultY, priceItemDefault)).to.be.revertedWith('AccessControl: account')
    })
    it('revert if token is sold', async function () {
      await market.setPriceForTokenId(defaultX, defaultY, priceItemDefault)
      await market.connect(buyer1).buyNFTisSale(defaultX, defaultY)
      await expect(market.setPriceForTokenId(defaultX, defaultY, priceItemDefault)).to.be.revertedWith('token was on sale')
    })
    it('set price successfully', async function () {
      const setPriceTx = await market.setPriceForTokenId(defaultX, defaultY, priceItemDefault)
      await expect(setPriceTx).to.be.emit(market, 'TokenOnSale').withArgs(encoded, defaultX, defaultY, 0, priceItemDefault, owner.address)
    })
  })
  describe('#resaleTokenId', () => {
    beforeEach(async () => {
      await market.mintByAdmin(defaultX, defaultY, seller.address)
    })
    it('revert if not owner', async function () {
      await expect(market.connect(buyer1).resellTokenId(defaultX, defaultY, priceItemDefault)).to.be.revertedWith('sender is not owner')
    })
    it('resale successfully', async function () {
      const resellTx = await market.connect(seller).resellTokenId(defaultX, defaultY, priceItemDefault)
      await expect(resellTx).to.be.emit(market, 'TokenOnSale').withArgs(encoded, defaultX, defaultY, 1, priceItemDefault, seller.address)
      expect((await market.infoNFT(encoded)).indexSale).to.be.equal(1)
      expect((await market.infoNFT(encoded)).seller).to.be.equal(seller.address)
      expect((await market.infoNFT(encoded)).owner).to.be.equal(address0)
      expect((await market.infoNFT(encoded)).price).to.be.equal(priceItemDefault)
      expect((await market.infoNFT(encoded)).sold).to.be.equal(false)
      expect((await market.infoNFT(encoded)).isCanceled).to.be.equal(false)
    })
  })
  describe('#buyNFTisSale', () => {
    beforeEach(async () => {
      await market.mintByAdmin(defaultX, defaultY, seller.address)
      await market.connect(seller).resellTokenId(defaultX, defaultY, priceItemDefault)
      await marketToken.connect(buyer1).approve(market.address, balanceAddr2)
    })
    it('revert if sender is owner', async function () {
      await marketToken.connect(seller).approve(market.address, balanceAddr2)
      await expect(market.connect(seller).buyNFTisSale(defaultX, defaultY)).to.be.revertedWith('seller must not sender')
    })
    it('revert if price = 0', async function () {
      await expect(market.connect(buyer1).buyNFTisSale(defaultX2, defaultY2)).to.be.revertedWith('land do not set price')
    })
    it('revert if land was sold', async function () {
      await market.connect(buyer1).buyNFTisSale(defaultX, defaultY)
      await expect(market.connect(buyer2).buyNFTisSale(defaultX, defaultY)).to.be.revertedWith('land do not set price')
    })
    it('revert if land was canceled', async function () {
      await market.connect(seller).cancelSale(defaultX, defaultY)
      await expect(market.connect(buyer2).buyNFTisSale(defaultX, defaultY)).to.be.revertedWith('land sale was canceled')
    })
    it('buy successfully (from other user)', async function () {
      const buyTX = await market.connect(buyer1).buyNFTisSale(defaultX, defaultY)

      await expect(buyTX).to.be.emit(market, 'TokenBought').withArgs(encoded, defaultX, defaultY, 1, buyer1.address, seller.address)
      expect((await market.infoNFT(encoded)).indexSale).to.be.equal(2)
      expect((await market.infoNFT(encoded)).seller).to.be.equal(seller.address)
      expect((await market.infoNFT(encoded)).owner).to.be.equal(buyer1.address)
      expect((await market.infoNFT(encoded)).price).to.be.equal(0)
      expect((await market.infoNFT(encoded)).sold).to.be.equal(true)
      expect((await market.infoNFT(encoded)).isCanceled).to.be.equal(false)
      expect(await marketToken.balanceOf(seller.address)).to.be.equal(balanceAddr3.add(priceItemDefault))
      expect(await marketToken.balanceOf(buyer1.address)).to.be.equal(balanceAddr1.sub(priceItemDefault))
      expect(await land.balanceOf(buyer1.address)).to.be.equal(1)
      expect(await land.balanceOf(seller.address)).to.be.equal(0)
    })
    it('buy successfully (from admin)', async function () {
      await market.setPriceForTokenId(defaultX2, defaultY2, priceItemDefault)
      const buyTX = await market.connect(buyer1).buyNFTisSale(defaultX2, defaultY2)
      await expect(buyTX).to.be.emit(market, 'TokenBought').withArgs(encoded2, defaultX2, defaultY2, 0, buyer1.address, address0)
      expect((await market.infoNFT(await land.encodeTokenId(defaultX2, defaultY2))).indexSale).to.be.equal(1)
      expect((await market.infoNFT(await land.encodeTokenId(defaultX2, defaultY2))).seller).to.be.equal(address0)
      expect((await market.infoNFT(await land.encodeTokenId(defaultX2, defaultY2))).owner).to.be.equal(buyer1.address)
      expect((await market.infoNFT(await land.encodeTokenId(defaultX2, defaultY2))).price).to.be.equal(0)
      expect((await market.infoNFT(await land.encodeTokenId(defaultX2, defaultY2))).sold).to.be.equal(true)
      expect((await market.infoNFT(await land.encodeTokenId(defaultX2, defaultY2))).isCanceled).to.be.equal(false)
      expect(await marketToken.balanceOf(manager.address)).to.be.equal(priceItemDefault)
      expect(await marketToken.balanceOf(buyer1.address)).to.be.equal(balanceAddr1.sub(priceItemDefault))
      expect(await land.balanceOf(buyer1.address)).to.be.equal(1)
    })
  })
  describe('#offerLand', () => {
    beforeEach(async () => {
      await market.mintByAdmin(defaultX, defaultY, seller.address)
      await market.connect(seller).resellTokenId(defaultX, defaultY, priceItemDefault)
      await marketToken.connect(buyer1).approve(market.address, balanceAddr2)
    })
    it('revert if sender is owner', async function () {
      await expect(market.connect(seller).offerLand(defaultX, defaultY, amountOfferDefault)).to.be.revertedWith('seller must not sender')
    })
    it('revert if price = 0', async function () {
      await expect(market.connect(buyer1).offerLand(defaultX2, defaultY2, amountOfferDefault)).to.be.revertedWith('price must greater than 0')
    })
    it('revert if land was sold', async function () {
      await market.connect(buyer1).buyNFTisSale(defaultX, defaultY)
      await expect(market.connect(buyer1).offerLand(defaultX, defaultY, amountOfferDefault)).to.be.revertedWith('price must greater than 0')
    })
    it('revert if land was canceled', async function () {
      await market.connect(seller).cancelSale(defaultX, defaultY)
      await expect(market.connect(buyer1).offerLand(defaultX, defaultY, amountOfferDefault)).to.be.revertedWith('land sale was canceled')
    })
    it('offer successfully', async function () {
      const offerTx = await market.connect(buyer1).offerLand(defaultX, defaultY, amountOfferDefault)
      await expect(offerTx).to.be.emit(market, 'Offered').withArgs(encoded, defaultX, defaultY, 1, 1, amountOfferDefault, buyer1.address, seller.address)
      expect((await market.itemToOffer(encoded, 1, 1)).asker).to.be.equal(buyer1.address)
      expect((await market.itemToOffer(encoded, 1, 1)).amount).to.be.equal(amountOfferDefault)
      expect((await market.itemToOffer(encoded, 1, 1)).isRefuned).to.be.equal(false)
      expect((await market.itemToOffer(encoded, 1, 1)).isWinner).to.be.equal(false)
      expect(await marketToken.balanceOf(buyer1.address)).to.be.equal(balanceAddr1.sub(amountOfferDefault))
      expect(await marketToken.balanceOf(market.address)).to.be.equal(amountOfferDefault)
    })
  })
  describe('#selectOfferWhenAdminSale', () => {
    beforeEach(async () => {
      await market.setPriceForTokenId(defaultX, defaultY, priceItemDefault)
      await marketToken.connect(buyer1).approve(market.address, balanceAddr1)
      await marketToken.connect(buyer2).approve(market.address, balanceAddr2)
      await market.connect(buyer1).offerLand(defaultX, defaultY, amountOfferDefault)
    })
    it('revert if offer id = 0', async function () {
      await expect(market.selectOfferWhenAdminSale(defaultX, defaultY, 0)).to.be.revertedWith('offerId is not equal zero')
    })
    it('revert if nft is init sale', async function () {
      await market.mintByAdmin(defaultX2, defaultY2, seller.address)
      await market.connect(seller).resellTokenId(defaultX2, defaultY2, priceItemDefault)
      await market.connect(buyer1).offerLand(defaultX2, defaultY2, amountOfferDefault)
      await marketToken.connect(buyer1).approve(market.address, balanceAddr2)
      await expect(market.selectOfferWhenAdminSale(defaultX2, defaultY2, 1)).to.be.revertedWith('nft must sell by admin')
    })
    it('revert if land was sold', async function () {
      await market.connect(buyer2).buyNFTisSale(defaultX, defaultY)
      await expect(market.selectOfferWhenAdminSale(defaultX, defaultY, 1)).to.be.revertedWith('land was sold')
    })
    it('revert if offer was refunded', async function () {
      await market.connect(buyer1).refundOffer(defaultX, defaultY, 0, 1)
      await expect(market.selectOfferWhenAdminSale(defaultX, defaultY, 1)).to.be.revertedWith('offer was refunded')
    })
    it('select offer successfully', async function () {
      const selectTx = await market.selectOfferWhenAdminSale(defaultX, defaultY, 1)
      await expect(selectTx).to.be.emit(market, 'OfferSelected').withArgs(encoded, defaultX, defaultY, 0, 1, address0, buyer1.address)
      expect((await market.itemToOffer(encoded, 0, 1)).asker).to.be.equal(buyer1.address)
      expect((await market.itemToOffer(encoded, 0, 1)).amount).to.be.equal(amountOfferDefault)
      expect((await market.itemToOffer(encoded, 0, 1)).isRefuned).to.be.equal(false)
      expect((await market.itemToOffer(encoded, 0, 1)).isWinner).to.be.equal(true)
      expect(await land.balanceOf(buyer1.address)).to.be.equal(1)
      expect(await land.balanceOf(market.address)).to.be.equal(0)
      expect(await marketToken.balanceOf(manager.address)).to.be.equal(amountOfferDefault)
      expect(await marketToken.balanceOf(buyer1.address)).to.be.equal(balanceAddr1.sub(amountOfferDefault))
    })
  })
  describe('#selectOfferbyUser', () => {
    beforeEach(async () => {
      await market.mintByAdmin(defaultX, defaultY, seller.address)
      await market.connect(seller).resellTokenId(defaultX, defaultY, priceItemDefault)
      await marketToken.connect(buyer1).approve(market.address, balanceAddr2)
      await market.connect(buyer1).offerLand(defaultX, defaultY, amountOfferDefault)
    })
    it('revert if do not have any offer', async function () {
      await market.setPriceForTokenId(defaultX2, defaultY2, priceItemDefault)
      await expect(market.selectOfferbyUser(defaultX2, defaultY2, 1)).to.be.revertedWith("item don't have any offer")
    })
    it('revert if nft is init sale', async function () {
      await expect(market.selectOfferbyUser(defaultX, defaultY, 0)).to.be.revertedWith('offerId is not equal zero')
    })
    it('nft is sale by admin', async function () {
      await market.setPriceForTokenId(defaultX2, defaultY2, priceItemDefault)
      await market.connect(buyer1).offerLand(defaultX2, defaultY2, amountOfferDefault)
      await expect(market.selectOfferbyUser(defaultX2, defaultY2, 1)).to.be.revertedWith('nft is sale by admin')
    })
    it('revert if land was sold', async function () {
      await market.connect(buyer1).buyNFTisSale(defaultX, defaultY)
      await expect(market.selectOfferbyUser(defaultX, defaultY, 1)).to.be.revertedWith("item don't have any offer")
    })
    it('revert if land sale is canceled', async function () {
      await market.connect(seller).cancelSale(defaultX, defaultY)
      await expect(market.selectOfferbyUser(defaultX, defaultY, 1)).to.be.revertedWith("item don't have any offer")
    })
    it('revert if offer was refunded', async function () {
      await market.connect(buyer1).refundOffer(defaultX, defaultY, 1, 1)
      await expect(market.selectOfferbyUser(defaultX, defaultY, 1)).to.be.revertedWith('offer was refunded')
    })
    it('revert if offer owner is winner', async function () {
      await market.selectOfferbyUser(defaultX, defaultY, 1)
      await expect(market.selectOfferbyUser(defaultX, defaultY, 1)).to.be.revertedWith("item don't have any offer")
    })
    it('select offer successfully', async function () {
      const selectTx = await market.selectOfferbyUser(defaultX, defaultY, 1)
      await expect(selectTx).to.be.emit(market, 'OfferSelected').withArgs(encoded, defaultX, defaultY, 1, 1, seller.address, buyer1.address)
      expect((await market.itemToOffer(encoded, 1, 1)).asker).to.be.equal(buyer1.address)
      expect((await market.itemToOffer(encoded, 1, 1)).amount).to.be.equal(amountOfferDefault)
      expect((await market.itemToOffer(encoded, 1, 1)).isRefuned).to.be.equal(false)
      expect((await market.itemToOffer(encoded, 1, 1)).isWinner).to.be.equal(true)
      expect(await land.balanceOf(buyer1.address)).to.be.equal(1)
      expect(await land.balanceOf(market.address)).to.be.equal(0)
      expect(await marketToken.balanceOf(seller.address)).to.be.equal(balanceAddr3.add(amountOfferDefault))
      expect(await marketToken.balanceOf(buyer1.address)).to.be.equal(balanceAddr1.sub(amountOfferDefault))
    })
  })
  describe('#refundOffer', () => {
    beforeEach(async () => {
      await market.mintByAdmin(defaultX, defaultY, seller.address)
      await market.connect(seller).resellTokenId(defaultX, defaultY, priceItemDefault)
      await marketToken.connect(buyer1).approve(market.address, balanceAddr2)
      await market.connect(buyer1).offerLand(defaultX, defaultY, amountOfferDefault)
    })
    it('revert if offerid = 0', async function () {
      await expect(market.connect(buyer1).refundOffer(defaultX, defaultY, 1, 0)).to.be.revertedWith('offerId must greater than 0')
    })
    it('revert if offer is refuned', async function () {
      await market.connect(buyer1).refundOffer(defaultX, defaultY, 1, 1)
      await expect(market.connect(buyer1).refundOffer(defaultX, defaultY, 1, 1)).to.be.revertedWith('offer was refunded')
    })
    it('revert if offer owner is the winner', async function () {
      await market.selectOfferbyUser(defaultX, defaultY, 1)
      await expect(market.connect(buyer1).refundOffer(defaultX, defaultY, 1, 1)).to.be.revertedWith('offer owner must not be the winner')
    })
    it('revert if sender is not offer owner', async function () {
      await expect(market.connect(buyer2).refundOffer(defaultX, defaultY, 1, 1)).to.be.revertedWith('sender must be owner')
    })
    it('refund offer successfully', async function () {
      const refundTx = await market.connect(buyer1).refundOffer(defaultX, defaultY, 1, 1)
      await expect(refundTx).to.be.emit(market, 'OfferRefunded').withArgs(encoded, defaultX, defaultY, 1, 1)
      expect((await market.itemToOffer(encoded, 1, 1)).asker).to.be.equal(buyer1.address)
      expect((await market.itemToOffer(encoded, 1, 1)).amount).to.be.equal(amountOfferDefault)
      expect((await market.itemToOffer(encoded, 1, 1)).isRefuned).to.be.equal(true)
      expect((await market.itemToOffer(encoded, 1, 1)).isWinner).to.be.equal(false)
      expect(await marketToken.balanceOf(buyer1.address)).to.be.equal(balanceAddr1)
      expect(await marketToken.balanceOf(market.address)).to.be.equal(0)
    })
  })
  describe('#cancelSale', () => {
    beforeEach(async () => {
      await market.mintByAdmin(defaultX, defaultY, seller.address)
      await market.connect(seller).resellTokenId(defaultX, defaultY, priceItemDefault)
      await marketToken.connect(buyer1).approve(market.address, balanceAddr2)
    })
    it('revert if item was sold', async function () {
      await market.connect(buyer1).buyNFTisSale(defaultX, defaultY)
      await expect(market.connect(seller).cancelSale(defaultX, defaultY)).to.be.revertedWith('tokenId was sold')
    })
    it('revert if item was canceled', async function () {
      await market.connect(seller).cancelSale(defaultX, defaultY)
      await expect(market.connect(seller).cancelSale(defaultX, defaultY)).to.be.revertedWith('land sale was canceled')
    })
    it('revert if item is sold by admin', async function () {
      await market.setPriceForTokenId(defaultX2, defaultY2, priceItemDefault)
      await expect(market.cancelSale(defaultX2, defaultY2)).to.be.revertedWith('sold by admin')
    })
    it('revert if sender is not owner', async function () {
      await expect(market.connect(buyer1).cancelSale(defaultX, defaultY)).to.be.revertedWith('sender must be seller')
    })
    it('cancel successfully', async function () {
      const cancelTx = await market.connect(seller).cancelSale(defaultX, defaultY)
      await expect(cancelTx).to.be.emit(market, 'SaleCanceled').withArgs(encoded, defaultX, defaultY, 1)
      expect((await market.infoNFT(encoded)).indexSale).to.be.equal(2)
      expect((await market.infoNFT(encoded)).seller).to.be.equal(seller.address)
      expect((await market.infoNFT(encoded)).owner).to.be.equal(seller.address)
      expect((await market.infoNFT(encoded)).price).to.be.equal(priceItemDefault)
      expect((await market.infoNFT(encoded)).sold).to.be.equal(false)
      expect((await market.infoNFT(encoded)).isCanceled).to.be.equal(true)
    })
  })
  describe('#mintByAdmin', () => {
    it('revert if token has sell', async function () {
      await market.setPriceForTokenId(defaultX, defaultY, priceItemDefault)
      await expect(market.mintByAdmin(defaultX, defaultY, seller.address)).to.be.revertedWith('token sale has existed')
    })
    it('revert if sender is not admin', async function () {
      await expect(market.connect(buyer1).mintByAdmin(defaultX, defaultY, seller.address)).to.be.revertedWith('AccessControl: account')
    })
    it('mint successfully', async function () {
      await market.mintByAdmin(defaultX, defaultY, seller.address)
      expect(await land.balanceOf(seller.address)).to.be.equal(1)
      expect((await market.infoNFT(encoded)).indexSale).to.be.equal(1)
      expect((await market.infoNFT(encoded)).seller).to.be.equal(address0)
      expect((await market.infoNFT(encoded)).owner).to.be.equal(seller.address)
      expect((await market.infoNFT(encoded)).price).to.be.equal(0)
      expect((await market.infoNFT(encoded)).sold).to.be.equal(true)
      expect((await market.infoNFT(encoded)).isCanceled).to.be.equal(true)
    })
  })
})
