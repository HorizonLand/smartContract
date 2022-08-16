import { BigNumber, BigNumberish } from 'ethers'
import { assert, expect } from 'chai'
import { ethers } from 'hardhat'
import { Billiard721 } from 'types'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { MarketToken } from 'types'
import { Piece } from 'types'

describe('billiards', function () {
  let [admin, buyer1, buyer2]: SignerWithAddress[] = []
  let billiard721: Billiard721
  let token: MarketToken
  let piece: Piece
  let priceGacha1: BigNumber = ethers.utils.parseUnits('100', 'ether')
  let pricePieceGacha1: BigNumber = BigNumber.from('100')
  let priceDefault: BigNumber = ethers.utils.parseUnits('100', 'ether')
  let pricePieceDefault: BigNumber = BigNumber.from('10')
  let balanceBuyer1: BigNumber = ethers.utils.parseUnits('10000000', 'ether')
  let balancePieceBuyer1: BigNumber = BigNumber.from('1000')
  let burnRate: BigNumberish[] = [1, 2, 3, 4, 5, 6]
  let rankRatiosDefault: [BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish] = [35, 20, 18, 15, 11, 0]
  beforeEach(async () => {
    ;[admin, buyer1, buyer2] = await ethers.getSigners()
    const Token = await ethers.getContractFactory('MarketToken')
    token = await Token.deploy()
    const tokenAddress = token.address
    const Piece = await ethers.getContractFactory('Piece')
    piece = await Piece.deploy()
    const pieceAddress = piece.address

    const Billiard721 = await ethers.getContractFactory('Billiard721')
    billiard721 = await Billiard721.deploy(tokenAddress, pieceAddress)
    await billiard721.deployed()

    await token.transfer(buyer1.address, balanceBuyer1)
    await piece.mint(buyer1.address, balancePieceBuyer1)
    await piece.grantRole('0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6', billiard721.address)
  })
  describe('#addGacha', async () => {
    it('should revert if sender is not owner', async function () {
      await expect(billiard721.connect(buyer1).addGacha(priceDefault, pricePieceDefault, rankRatiosDefault)).to.be.reverted
    })
    it('should add gacha successfully', async function () {
      const addGachaTx = await billiard721.addGacha(priceDefault, pricePieceDefault, rankRatiosDefault)
      await expect(addGachaTx).to.emit(billiard721, 'GachaAdded').withArgs(3, priceDefault, pricePieceDefault, rankRatiosDefault)
      expect((await billiard721._idToGacha(3)).price).to.be.equal(priceDefault)
      expect((await billiard721._idToGacha(3)).pricePiece).to.be.equal(pricePieceDefault)
    })
  })
  describe('#updateGacha', async () => {
    it('should revert if sender is not owner', async function () {
      await expect(billiard721.connect(buyer1).updateGacha(3, priceDefault, pricePieceDefault, rankRatiosDefault)).to.be.reverted
    })
    it('should revert if sender gachaId not exist', async function () {
      await expect(billiard721.updateGacha(3, priceDefault, pricePieceDefault, rankRatiosDefault)).to.be.reverted
    })
    it('should update gacha successfully', async function () {
      const updateGachaTx = await billiard721.updateGacha(1, priceDefault, pricePieceDefault, rankRatiosDefault)
      await expect(updateGachaTx).to.emit(billiard721, 'GachaUpdated').withArgs(1, priceDefault, pricePieceDefault, rankRatiosDefault)
      expect((await billiard721._idToGacha(1)).price).to.be.equal(priceDefault)
      expect((await billiard721._idToGacha(1)).pricePiece).to.be.equal(pricePieceDefault)
    })
  })
  describe('#buyGachaBox', async () => {
    beforeEach(async () => {
      await token.connect(buyer1).approve(billiard721.address, priceGacha1)
      await piece.connect(buyer1).approve(billiard721.address, pricePieceGacha1)
    })
    it('should revert if type buy not 0 or 1', async function () {
      await expect(billiard721.connect(buyer1).buyGachaBox(3, 1)).to.be.reverted
    })
    it('should revert if gachaId not exist', async function () {
      await expect(billiard721.connect(buyer1).buyGachaBox(1, 3)).to.be.reverted
    })
    it('should buy gacha by market token correctly', async function () {
      const buyTx = await billiard721.connect(buyer1).buyGachaBox(0, 1)
      await expect(buyTx).to.emit(billiard721, 'GachaOpened')
      expect(await token.balanceOf(buyer1.address)).to.be.equal(balanceBuyer1.sub(priceGacha1))
      expect(await token.balanceOf(billiard721.address)).to.be.equal(priceGacha1)
      expect(await billiard721.balanceOf(buyer1.address)).to.be.equal(1)
    })
    it('should buy gacha by piece token correctly', async function () {
      const buyTx = await billiard721.connect(buyer1).buyGachaBox(1, 1)
      await expect(buyTx).to.emit(billiard721, 'GachaOpened')
      expect(await piece.balanceOf(buyer1.address)).to.be.equal(balancePieceBuyer1.sub(pricePieceGacha1))
      expect(await piece.balanceOf(billiard721.address)).to.be.equal(pricePieceGacha1)
      expect(await billiard721.balanceOf(buyer1.address)).to.be.equal(1)
    })
  })
  describe('#buyMultiGachaBox', async () => {
    beforeEach(async () => {
      await token.connect(buyer1).approve(billiard721.address, priceGacha1.mul(2))
      await piece.connect(buyer1).approve(billiard721.address, pricePieceGacha1.mul(2))
    })
    it('should revert if type buy not 0 or 1', async function () {
      await expect(billiard721.connect(buyer1).buyMultiGachaBox(1, 3, 1)).to.be.reverted
    })
    it('should revert if gachaId not exist', async function () {
      await expect(billiard721.connect(buyer1).buyMultiGachaBox(1, 1, 3)).to.be.reverted
    })
    it('should buy gacha by market token correctly', async function () {
      await billiard721.connect(buyer1).buyMultiGachaBox(2, 0, 1)
      expect(await token.balanceOf(buyer1.address)).to.be.equal(balanceBuyer1.sub(priceGacha1.mul(2)))
      expect(await token.balanceOf(billiard721.address)).to.be.equal(priceGacha1.mul(2))
      expect(await billiard721.balanceOf(buyer1.address)).to.be.equal(2)
    })
    it('should buy gacha by piece token correctly', async function () {
      await billiard721.connect(buyer1).buyMultiGachaBox(2, 1, 1)
      expect(await piece.balanceOf(buyer1.address)).to.be.equal(balancePieceBuyer1.sub(pricePieceGacha1.mul(2)))
      expect(await piece.balanceOf(billiard721.address)).to.be.equal(pricePieceGacha1.mul(2))
      expect(await billiard721.balanceOf(buyer1.address)).to.be.equal(2)
    })
  })
  describe('#updateBilliard', async () => {
    beforeEach(async function () {
      await token.connect(buyer1).approve(billiard721.address, priceGacha1.mul(2))
      await billiard721.connect(buyer1).buyMultiGachaBox(2, 0, 1)
    })
    it('should revert if sender is not owner', async function () {
      await expect(billiard721.connect(buyer1).updateBilliard(1, 1, 1, 1, 1)).to.be.reverted
    })
    it('should revert if token not exist', async function () {
      await expect(billiard721.updateBilliard(3, 1, 1, 1, 1)).to.be.reverted
    })
    it('should update billiard successfully', async function () {
      const updateTx = await billiard721.updateBilliard(1, 1, 2, 3, 4)
      await expect(updateTx).to.emit(billiard721, 'BilliardUpdated')
      expect((await billiard721._idToBilliard(1)).force).to.be.equal(1)
      expect((await billiard721._idToBilliard(1)).aim).to.be.equal(2)
      expect((await billiard721._idToBilliard(1)).spin).to.be.equal(3)
      expect((await billiard721._idToBilliard(1)).time).to.be.equal(4)
    })
  })
  describe('#burn', async () => {
    beforeEach(async function () {
      await token.connect(buyer1).approve(billiard721.address, priceGacha1.mul(2))
      await billiard721.connect(buyer1).buyMultiGachaBox(2, 0, 1)
    })
    it('should revert if sender is not token owner', async function () {
      await expect(billiard721.burn(1)).to.be.reverted
    })
    it('should revert if token id not exist', async function () {
      await expect(billiard721.connect(buyer1).burn(3)).to.be.reverted
    })
    it('should burn token correctly', async function () {
      const rank = (await billiard721._idToBilliard(1)).rank
      await billiard721.connect(buyer1).burn(1)
      expect(await billiard721.balanceOf(buyer1.address)).to.be.equal(1)
      expect((await billiard721._idToBilliard(1)).force).to.be.equal(0)
      expect((await billiard721._idToBilliard(1)).aim).to.be.equal(0)
      expect((await billiard721._idToBilliard(1)).spin).to.be.equal(0)
      expect((await billiard721._idToBilliard(1)).time).to.be.equal(0)
      expect(await piece.balanceOf(buyer1.address)).to.be.equal(balancePieceBuyer1.add(burnRate[rank]))
    })
  })
  describe('#withdraw', async () => {
    let contractBalance: BigNumber
    beforeEach(async function () {
      await token.connect(buyer1).approve(billiard721.address, priceGacha1.mul(2))
      await billiard721.connect(buyer1).buyMultiGachaBox(2, 0, 1)
      contractBalance = await token.balanceOf(billiard721.address)
    })
    it('should revert if sender is not owner', async function () {
      await expect(billiard721.connect(buyer1).withdrawToken(token.address, admin.address, contractBalance)).to.be.reverted
    })
    it('should revert if not enough balance', async function () {
      await expect(billiard721.withdrawToken(token.address, admin.address, contractBalance.add(1))).to.be.reverted
    })
    it('should withdraw correctly', async function () {
      const balanceAdminBeforeWithdraw = await token.balanceOf(admin.address)
      await billiard721.withdrawToken(token.address, admin.address, contractBalance)
      expect(await token.balanceOf(admin.address)).to.be.equal(balanceAdminBeforeWithdraw.add(contractBalance))
      expect(await token.balanceOf(billiard721.address)).to.be.equal(0)
    })
  })
})
