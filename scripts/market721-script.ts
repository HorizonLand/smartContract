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
  item1155 = await ethers.getContractAt('Item1155', '0x2dEf2AFff1020FEEbce026466D9A59A4446B1669')
  billiard = await ethers.getContractAt('Billiard721', '0x3793a3A269a699450a0645E2bba3399BdD20486c')
  market721 = await ethers.getContractAt('Marketplace', '0x0100e6f7AeFE2bb866c95b725325c764D65aaCAF')
  marketToken = await ethers.getContractAt('MarketToken', '0x2E630E6499e65DF5811D6f122Ba139Cd91F28f52')
  //await billiard.connect(accountImport).buyMultiGachaBox(10,0,1)

    // const sellTx8 = await market721.connect(accountImport).createMarketItem('0x3793a3A269a699450a0645E2bba3399BdD20486c', 23, await ethers.utils.parseEther('100'))
    // await sellTx8.wait()
    // const sellTx9 = await market721.connect(accountImport).createMarketItem('0x3793a3A269a699450a0645E2bba3399BdD20486c', 22, await ethers.utils.parseEther('300'))
    // await sellTx9.wait()
    // const sellTx0 = await market721.connect(accountImport).createMarketItem('0x3793a3A269a699450a0645E2bba3399BdD20486c', 21, await ethers.utils.parseEther('20'))
    // await sellTx0.wait()
    // const sellTx00 = await market721.connect(accountImport).createMarketItem('0x3793a3A269a699450a0645E2bba3399BdD20486c', 20, await ethers.utils.parseEther('10'))
    // await sellTx00.wait()
    const apprioveTx = await marketToken.approve('0x0100e6f7AeFE2bb866c95b725325c764D65aaCAF', ethers.utils.parseEther('100000000000000000'))

    // const offerTx = await market721.connect(accountImport).selectOffer(4,1)
    const offerTx = await market721.connect(accountImport).cancelMarketItem(8)
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
