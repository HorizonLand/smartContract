import { ethers, network } from 'hardhat'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import { MarketToken, Piece, Marketplace, Billiard721, Item1155 } from 'types'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Contracts } from 'tasks/interface/contract-info.interface'
async function main() {
  // const DEPLOYMENT_PATH = resolve('deployments')
  // const DATA_PATH = resolve(DEPLOYMENT_PATH, 'data')
  // const CONTRACT_PATH = resolve(DATA_PATH, `contracts.${network.name}.json`)

  // if (!existsSync(DATA_PATH)) {
  //   mkdirSync(DATA_PATH)
  // }
  // let accountImport = new ethers.Wallet(
  //   'fcd59a4b02702b7f608b49a436ebb2f743fdaad8d9b3255bd1a3423422a5eed9'
  // )
  let [owner, accountImport, account33e]: SignerWithAddress[] =
    await ethers.getSigners()

  // let contractList: Contracts = existsSync(CONTRACT_PATH)
  //   ? JSON.parse(readFileSync(CONTRACT_PATH).toString())
  //   : {}
  let marketToken: MarketToken
  let tokenPiece: Piece
  let market721: Marketplace
  let billiard: Billiard721
  let item1155: Item1155
  const MarketToken = await ethers.getContractFactory('MarketToken')
  marketToken = await MarketToken.deploy()
  await marketToken.deployed()
  console.log('MarketToken deployed to:', marketToken.address)

  const Piece = await ethers.getContractFactory('Piece')
  tokenPiece = await Piece.deploy()
  await tokenPiece.deployed()
  console.log('piece deployed to:', tokenPiece.address)

  const Marketplace = await ethers.getContractFactory('Marketplace')
  market721 = await Marketplace.deploy(marketToken.address, 0, 5)
  await market721.deployed()
  console.log('market721 deployed to:', market721.address)

  const Billiard721 = await ethers.getContractFactory('Billiard721')
  billiard = await Billiard721.deploy(marketToken.address, tokenPiece.address)
  await billiard.deployed()
  console.log('billiard deployed to:', billiard.address)

  const Item1155 = await ethers.getContractFactory('Item1155')
  item1155 = await Item1155.deploy(marketToken.address)
  await item1155.deployed()
  console.log('item1155 deployed to:', item1155.address)

  const addMinterRoleTx = await tokenPiece.grantRole(
    ethers.utils.solidityKeccak256(['string'], ['MINTER_ROLE']),
    billiard.address
  )
  await addMinterRoleTx.wait()
  const transferMarketTx = await marketToken.transfer(
    accountImport.address,
    await ethers.utils.parseEther('100000')
  )
  await transferMarketTx.wait()
  const mintPieceTx = await tokenPiece.mint(accountImport.address, 100000)
  await mintPieceTx.wait()
  const updateGachaTx = await billiard.updateGacha(
    1,
    await ethers.utils.parseEther('200'),
    200,
    [36, 20, 18, 15, 9, 2]
  )
  await updateGachaTx.wait()
  console.log('updateGacha successfully:')
  const approveMarketTx = await marketToken
    .connect(accountImport)
    .approve(billiard.address, await ethers.utils.parseEther('100000'))
  console.log('approveMarketTx successfully:')
  await approveMarketTx.wait()
  const approveMarketTx2 = await marketToken
    .connect(accountImport)
    .approve(item1155.address, await ethers.utils.parseEther('100000'))
  await approveMarketTx2.wait()
  console.log('approveMarketTx successfully:')
  const approvePieceTx1 = await tokenPiece
    .connect(accountImport)
    .approve(item1155.address, await ethers.utils.parseEther('100000'))
  await approvePieceTx1.wait()
  console.log('approveMarketTx successfully:')
  const approvePieceTx2 = await tokenPiece
    .connect(accountImport)
    .approve(billiard.address, await ethers.utils.parseEther('100000'))
  await approvePieceTx2.wait()

  console.log('approveMarketTx successfully:')
  const approveMarketTx3 = await marketToken
    .approve(item1155.address, await ethers.utils.parseEther('100000'))
  await approveMarketTx3.wait()
  console.log('approveMarketTx successfully:')
  const approveMarketTx4 = await marketToken
    .approve(item1155.address, await ethers.utils.parseEther('100000'))
  await approveMarketTx4.wait()
  console.log('approveMarketTx successfully:')
  const approvePieceTx3 = await tokenPiece
    .approve(item1155.address, await ethers.utils.parseEther('100000'))
  await approvePieceTx3.wait()
  console.log('approveMarketTx successfully:')
  const approvePieceTx4 = await tokenPiece
    .approve(billiard.address, await ethers.utils.parseEther('100000'))
  await approvePieceTx4.wait()

  console.log('approveMarketTx successfully:')
  const openGachaTx = await billiard.connect(accountImport).buyGachaBox(0, 1)
  await openGachaTx.wait()
  console.log('openGachaTx successfully:')
  const openGachaTx2 = await billiard.connect(accountImport).buyGachaBox(1, 2)
  await openGachaTx2.wait()
  console.log('openGachaTx2 successfully:')
  const openGachaTx3 = await billiard.connect(accountImport).buyGachaBox(0, 2)
  await openGachaTx3.wait()
  console.log('openGachaTx3 successfully:')
  const openGachaTx4 = await billiard.connect(accountImport).buyGachaBox(1, 1)
  await openGachaTx4.wait()
  console.log('openGachaTx4 successfully:')

  const updateBilliardTx = await billiard.updateBilliard(1, 2, 2, 2, 2)
  await updateBilliardTx.wait()
  console.log('updateBilliardTx successfully:')

  const burnTx = await billiard.connect(accountImport).burn(2)
  await burnTx.wait()
  console.log('burnTx successfully:')

  const updateRankInfoTx = await item1155.updateRankInfo(1, 100)
  await updateRankInfoTx.wait()
  console.log('updateRankInfoTx successfully:')
  const updateRankInfoTx2 = await item1155.updateRankInfo(2, 20)
  await updateRankInfoTx2.wait()
  console.log('updateRankInfoTx2 successfully:')
  const mintTx = await item1155.mintItem(
    1,
    2,
    await ethers.utils.parseEther('100')
  )
  await mintTx.wait()
  console.log('mintTx successfully:')

  const mintTx2 = await item1155.mintItem(
    2,
    1,
    await ethers.utils.parseEther('200')
  )
  await mintTx2.wait()
  console.log('mintTx2 successfully:')

  const buyItemTx = await item1155.connect(accountImport).buyItem(1, 2)
  await buyItemTx.wait()
  console.log('buyItemTx successfully:')

  const buyItemTx2 = await item1155.connect(accountImport).buyItem(2, 10)
  await buyItemTx2.wait()
  console.log('buyItemTx2 successfully:')
  const buyItemTx3 = await item1155.buyItem(1, 2)
  await buyItemTx3.wait()
  console.log('buyItemTx3 successfully:')
  const buyItemTx4 = await item1155.buyItem(2, 10)
  await buyItemTx4.wait()
  console.log('buyItemTx4 successfully:')

  // contractList = {}

  // writeFileSync(CONTRACT_PATH, JSON.stringify(contractList, null, 2))
  // console.log(`Wrote data to file ${CONTRACT_PATH}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
