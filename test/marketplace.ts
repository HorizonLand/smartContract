import { BigNumber } from 'ethers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { MarketToken, Billiard721, Marketplace } from 'types'

describe('Marketplace ', () => {
  let nft: Billiard721
  let nftSell: Marketplace
  let marketToken: MarketToken
  let owner: SignerWithAddress
  let addr1: SignerWithAddress
  let addr2: SignerWithAddress
  let addr3: SignerWithAddress
  let address0: String = '0x0000000000000000000000000000000000000000'
  let balanceAddr1: BigNumber = ethers.utils.parseUnits('10000000', 'ether')
  let balanceAddr2: BigNumber = ethers.utils.parseUnits('10000000', 'ether')
  let balanceAddr3: BigNumber = ethers.utils.parseUnits('10000000', 'ether')
  let priceItemDefault: BigNumber = ethers.utils.parseUnits('100', 'ether')
  let offerPrice1: BigNumber = ethers.utils.parseUnits('50', 'ether')
  let offerPrice2: BigNumber = ethers.utils.parseUnits('80', 'ether')
  let priceItemAfterChange: BigNumber = ethers.utils.parseUnits('200', 'ether')
  let defaultFeeRate: BigNumber = BigNumber.from(20)
  let defaultFeeDecimal: BigNumber = BigNumber.from(0)
  let addressNft: string
  beforeEach(async () => {
    ;[owner, addr1, addr2, addr3] = await ethers.getSigners()
    const Token = await ethers.getContractFactory('MarketToken')
    marketToken = await Token.deploy()
    const tokenAddress = marketToken.address
    const Piece = await ethers.getContractFactory('Piece')
    const piece = await Piece.deploy()
    const pieceAddress = piece.address
    const Billiard721 = await ethers.getContractFactory('Billiard721')
    nft = await Billiard721.deploy(tokenAddress, pieceAddress)
    addressNft = nft.address
    await nft.deployed()
    await marketToken.transfer(addr1.address, balanceAddr1)
    await marketToken.transfer(addr2.address, balanceAddr2)
    await marketToken.transfer(addr3.address, balanceAddr3)
    const Marketplace = await ethers.getContractFactory('Marketplace')
    nftSell = await Marketplace.deploy(marketToken.address, defaultFeeDecimal, defaultFeeRate)
    await nftSell.deployed()
    await marketToken.connect(addr1).approve(nftSell.address, balanceAddr1)
    await marketToken.connect(addr1).approve(nft.address, balanceAddr1)
    await nft.connect(addr1).buyMultiGachaBox(1, 0, 1)
    await nft.connect(addr1).setApprovalForAll(nftSell.address, true)
    await marketToken.connect(addr2).approve(nftSell.address, balanceAddr1)
    await marketToken.connect(addr3).approve(nftSell.address, balanceAddr1)
    balanceAddr1 = await marketToken.balanceOf(addr1.address)
  })
  describe('#createMarketItem', () => {
    it('revert if sender is not owner', async function () {
      await expect(nftSell.createMarketItem(addressNft, 1, priceItemDefault)).to.be.reverted
    })
    it('revert if price = 0', async function () {
      await expect(nftSell.connect(addr1).createMarketItem(addressNft, 1, 0)).to.be.reverted
    })
    it('create item successfully', async function () {
      const createItemTx = await nftSell.connect(addr1).createMarketItem(addressNft, 1, priceItemDefault)
      await expect(createItemTx).to.emit(nftSell, 'MarketItemCreated')
      expect(await nft.balanceOf(addr1.address)).to.be.equal(0)
      expect(await nft.balanceOf(nftSell.address)).to.be.equal(1)
      expect((await nftSell.idToMarketItem(1)).itemId).to.be.equal(1)
      expect((await nftSell.idToMarketItem(1)).nftContract).to.be.equal(nft.address)
      expect((await nftSell.idToMarketItem(1)).tokenId).to.be.equal(1)
      expect((await nftSell.idToMarketItem(1)).seller).to.be.equal(addr1.address)
      expect((await nftSell.idToMarketItem(1)).owner).to.be.equal(address0)
      expect((await nftSell.idToMarketItem(1)).price).to.be.equal(priceItemDefault)
      expect((await nftSell.idToMarketItem(1)).sold).to.be.equal(false)
      expect((await nftSell.idToMarketItem(1)).isCanceled).to.be.equal(false)
      expect((await nftSell.idToMarketItem(1)).offerWin).to.be.equal(0)
    })
  })
  describe('#changePriceOfMarketItem', () => {
    beforeEach(async () => {
      await nftSell.connect(addr1).createMarketItem(addressNft, 1, priceItemDefault)
    })
    it('revert if not owner', async function () {
      await expect(nftSell.connect(addr2).changePriceOfMarketItem(1, priceItemAfterChange)).to.be.revertedWith('sender must be owner')
    })
    it('revert if item was sold', async function () {
      await nftSell.connect(addr2).buyItemDirectly(1)
      await expect(nftSell.connect(addr1).changePriceOfMarketItem(1, priceItemAfterChange)).to.be.revertedWith('Item has been sold')
    })
    it('revert if item was canceled', async function () {
      await nftSell.connect(addr1).cancelMarketItem(1)
      await expect(nftSell.connect(addr1).changePriceOfMarketItem(1, priceItemAfterChange)).to.be.revertedWith('Item has been canceled')
    })
    it('change price successfully', async function () {
      const changePriceTX = await nftSell.connect(addr1).changePriceOfMarketItem(1, priceItemAfterChange)
      expect((await nftSell.idToMarketItem(1)).price).to.be.equal(priceItemAfterChange)
    })
  })
  describe('#buyItemDirectly', () => {
    beforeEach(async () => {
      await nftSell.connect(addr1).createMarketItem(addressNft, 1, priceItemDefault)
    })
    it('revert if sender is owner', async function () {
      await expect(nftSell.connect(addr1).buyItemDirectly(1)).to.be.revertedWith('owner must not sender')
    })
    it('revert if item was sold', async function () {
      await nftSell.connect(addr2).buyItemDirectly(1)
      await expect(nftSell.connect(addr2).buyItemDirectly(1)).to.be.revertedWith('Item has been sold')
    })
    it('revert if item was canceled', async function () {
      await nftSell.connect(addr1).cancelMarketItem(1)
      await expect(nftSell.connect(addr2).buyItemDirectly(1)).to.be.revertedWith('Item has been canceled')
    })
    it('buy item correctly', async function () {
      const buyTx = await nftSell.connect(addr2).buyItemDirectly(1)
      await expect(buyTx).to.emit(nftSell, 'DirectlyBuyEvent').withArgs(addr2.address, addr1.address, 1, priceItemDefault)
      const fee = defaultFeeRate.mul(priceItemDefault).div(BigNumber.from(10).pow(defaultFeeDecimal.add(2)))
      expect(await marketToken.balanceOf(addr1.address)).to.be.equal(balanceAddr1.sub(fee).add(priceItemDefault))
      expect(await marketToken.balanceOf(addr2.address)).to.be.equal(balanceAddr2.sub(priceItemDefault))
      expect(await marketToken.balanceOf(nftSell.address)).to.be.equal(fee)
      expect(await nft.balanceOf(addr1.address)).to.be.equal(0)
      expect(await nft.balanceOf(addr2.address)).to.be.equal(1)
    })
  })
  describe('#cancelMarketItem', () => {
    beforeEach(async () => {
      await nftSell.connect(addr1).createMarketItem(addressNft, 1, priceItemDefault)
    })
    it('revert if sender is not item owner', async function () {
      await expect(nftSell.connect(addr2).cancelMarketItem(1)).to.be.revertedWith('sender is not item owner')
    })
    it('revert if item was sold', async function () {
      await nftSell.connect(addr2).buyItemDirectly(1)
      await expect(nftSell.connect(addr1).cancelMarketItem(1)).to.be.revertedWith('Item has been sold')
    })
    it('revert if item was sold by select offer', async function () {
      await nftSell.connect(addr2).createMarketOffer(1, offerPrice1)
      await nftSell.connect(addr3).createMarketOffer(1, offerPrice2)
      await nftSell.connect(addr1).selectOffer(1, 1)
      await expect(nftSell.connect(addr1).cancelMarketItem(1)).to.be.revertedWith('Item has been sold')
    })
    it('revert if item was canceled', async function () {
      await nftSell.connect(addr1).cancelMarketItem(1)
      await expect(nftSell.connect(addr1).cancelMarketItem(1)).to.be.revertedWith('Item has been canceled')
    })
    it('cancel item successfully', async function () {
      const cancelTx = await nftSell.connect(addr1).cancelMarketItem(1)
      await expect(cancelTx).to.emit(nftSell, 'CancelMarketItem').withArgs(addr1.address, 1)
      expect(await marketToken.balanceOf(addr1.address)).to.be.equal(balanceAddr1)
      expect(await marketToken.balanceOf(nftSell.address)).to.be.equal(0)
      expect(await nft.balanceOf(addr1.address)).to.be.equal(1)
      expect(await nft.balanceOf(nftSell.address)).to.be.equal(0)
    })
  })
  describe('#createMarketOffer', () => {
    beforeEach(async () => {
      await nftSell.connect(addr1).createMarketItem(addressNft, 1, priceItemDefault)
    })
    it('revert if sender is owner', async function () {
      await expect(nftSell.connect(addr1).createMarketOffer(1, offerPrice1)).to.be.revertedWith('owner must not sender')
    })
    it('revert if item was sold', async function () {
      await nftSell.connect(addr2).buyItemDirectly(1)
      await expect(nftSell.connect(addr2).createMarketOffer(1, offerPrice1)).to.be.revertedWith('Item has been sold')
    })
    it('revert if item was canceled', async function () {
      await nftSell.connect(addr1).cancelMarketItem(1)
      await expect(nftSell.connect(addr2).createMarketOffer(1, offerPrice1)).to.be.revertedWith('Item has been canceled')
    })
    it('revert if offer price = original price', async function () {
      await expect(nftSell.connect(addr2).createMarketOffer(1, priceItemDefault)).to.be.revertedWith('Offer price must less than item price')
    })
    it('revert if offer price > original price', async function () {
      await expect(nftSell.connect(addr2).createMarketOffer(1, priceItemDefault.add(1))).to.be.revertedWith('Offer price must less than item price')
    })
    it('create offer successfully', async function () {
      const createOffer = await nftSell.connect(addr2).createMarketOffer(1, offerPrice1)
      await expect(createOffer).to.emit(nftSell, 'MakeOfferEvent').withArgs(addr2.address, 1, offerPrice1, 1)
      expect(await marketToken.balanceOf(addr2.address)).to.be.equal(balanceAddr2.sub(offerPrice1))
      expect(await marketToken.balanceOf(nftSell.address)).to.be.equal(offerPrice1)
      expect((await nftSell.itemToOffer(1, 1)).offerId).to.be.equal(1)
      expect((await nftSell.itemToOffer(1, 1)).asker).to.be.equal(addr2.address)
      expect((await nftSell.itemToOffer(1, 1)).amount).to.be.equal(offerPrice1)
      expect((await nftSell.itemToOffer(1, 1)).refunable).to.be.equal(true)
    })
  })
  describe('#selectOffer', () => {
    beforeEach(async () => {
      await nftSell.connect(addr1).createMarketItem(addressNft, 1, priceItemDefault)
      await nftSell.connect(addr2).createMarketOffer(1, offerPrice1)
      await nftSell.connect(addr3).createMarketOffer(1, offerPrice2)
    })
    it('revert if sender was not item owner', async function () {
      await expect(nftSell.connect(addr2).selectOffer(1, 1)).to.be.revertedWith('sender is not owner')
    })
    it('revert if offer was refunded', async function () {
      await nftSell.connect(addr1).selectOffer(1, 2)
      await nftSell.connect(addr2).refundOffer(1, 1)
      await expect(nftSell.connect(addr1).selectOffer(1, 1)).to.be.revertedWith('Offer was refuned')
    })
    it('revert if item was sold', async function () {
      await nftSell.connect(addr2).buyItemDirectly(1)
      await expect(nftSell.connect(addr1).selectOffer(1, 1)).to.be.revertedWith('item was already sold')
    })
    it('revert if item was sold by offer select', async function () {
      await nftSell.connect(addr1).selectOffer(1, 2)
      await expect(nftSell.connect(addr1).selectOffer(1, 1)).to.be.revertedWith('item was already sold')
    })
    it('revert if item was canceled', async function () {
      await nftSell.connect(addr1).cancelMarketItem(1)
      await expect(nftSell.connect(addr1).selectOffer(1, 1)).to.be.revertedWith('Item was canceled')
    })
    it('select offer successfully', async function () {
      const selectTx = await nftSell.connect(addr1).selectOffer(1, 1)
      await expect(selectTx).to.emit(nftSell, 'SelectOfferEvent').withArgs(addr2.address, addr1.address, 1, 1, offerPrice1)
      const fee = defaultFeeRate.mul(offerPrice1).div(BigNumber.from(10).pow(defaultFeeDecimal.add(2)))
      expect(await marketToken.balanceOf(addr1.address)).to.be.equal(balanceAddr1.sub(fee).add(offerPrice1))
      expect(await marketToken.balanceOf(addr2.address)).to.be.equal(balanceAddr2.sub(offerPrice1))
      expect(await marketToken.balanceOf(nftSell.address)).to.be.equal(fee.add(offerPrice2))
      expect(await nft.balanceOf(addr1.address)).to.be.equal(0)
      expect(await nft.balanceOf(addr2.address)).to.be.equal(1)
    })
  })
  describe('#refundOffer', () => {
    beforeEach(async () => {
      await nftSell.connect(addr1).createMarketItem(addressNft, 1, priceItemDefault)
      await nftSell.connect(addr2).createMarketOffer(1, offerPrice1)
      await nftSell.connect(addr3).createMarketOffer(1, offerPrice2)
      await nftSell.connect(addr1).selectOffer(1, 1)
    })
    it('revert if offer was refunded', async function () {
      await nftSell.connect(addr3).refundOffer(1, 2)
      await expect(nftSell.connect(addr3).refundOffer(1, 2)).to.be.revertedWith('Offer has arlready refunded')
    })
    it('revert if offer owner is winner', async function () {
      await expect(nftSell.connect(addr2).refundOffer(1, 1)).to.be.revertedWith("Winner can't refund")
    })
    it('revert if sender is not offer owner', async function () {
      await expect(nftSell.connect(addr2).refundOffer(1, 2)).to.be.revertedWith("Sender isn't offer owner")
    })
    it('refund offer successfully if item was canceled', async function () {
      await nft.connect(addr1).buyMultiGachaBox(1, 0, 1)
      await nftSell.connect(addr1).createMarketItem(addressNft, 2, priceItemDefault)
      await nftSell.connect(addr2).createMarketOffer(2, offerPrice1)
      await nftSell.connect(addr3).createMarketOffer(2, offerPrice2)
      await nftSell.connect(addr1).cancelMarketItem(2)
      const refundTx = await nftSell.connect(addr3).refundOffer(2, 2)
      await expect(refundTx).to.emit(nftSell, 'RefundEvent').withArgs(addr3.address, 2, 2, offerPrice2)
      const fee = defaultFeeRate.mul(offerPrice1).div(BigNumber.from(10).pow(defaultFeeDecimal.add(2)))
      expect(await marketToken.balanceOf(addr3.address)).to.be.equal(balanceAddr3.sub(offerPrice2))
      expect(await marketToken.balanceOf(nftSell.address)).to.be.equal(offerPrice2.add(offerPrice1).add(fee))
    })
    it('refund offer successfully', async function () {
      const refundTx = await nftSell.connect(addr3).refundOffer(1, 2)
      await expect(refundTx).to.emit(nftSell, 'RefundEvent').withArgs(addr3.address, 1, 2, offerPrice2)
      const fee = defaultFeeRate.mul(offerPrice1).div(BigNumber.from(10).pow(defaultFeeDecimal.add(2)))
      expect(await marketToken.balanceOf(addr3.address)).to.be.equal(balanceAddr3)
      expect(await marketToken.balanceOf(nftSell.address)).to.be.equal(fee)
    })
  })
})
