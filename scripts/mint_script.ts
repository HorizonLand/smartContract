import { ethers, network } from 'hardhat'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import { MarketToken, Piece, Marketplace, Billiard721, Item1155 } from 'types'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
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
  
  const mintTx1 = await item1155.mintItem(
    1,
    1,
    await ethers.utils.parseEther('100')
  )
  await mintTx1.wait()
  console.log('mintTx successfully:')

  const mintTx2 = await item1155.mintItem(
    1,
    2,
    await ethers.utils.parseEther('200')
  )
  await mintTx2.wait()

  console.log('mintTx successfully:')
  const mintTx3 = await item1155.mintItem(
    1,
    1,
    await ethers.utils.parseEther('100')
  )
  await mintTx3.wait()
  console.log('mintTx successfully:')

  const mintTx4 = await item1155.mintItem(
    1,
    2,
    await ethers.utils.parseEther('200')
  )
  await mintTx4.wait()
  
  const mintTx5 = await item1155.mintItem(
    0,
    2,
    await ethers.utils.parseEther('100')
  )
  await mintTx5.wait()
  console.log('mintTx successfully:')

  const mintTx6 = await item1155.mintItem(
    1,
    1,
    await ethers.utils.parseEther('200')
  )
  await mintTx6.wait()

  const mintTx7 = await item1155.mintItem(
    0,
    2,
    await ethers.utils.parseEther('100')
  )
  await mintTx7.wait()
  console.log('mintTx successfully:')

  const mintTx8 = await item1155.mintItem(
    1,
    1,
    await ethers.utils.parseEther('200')
  )
  await mintTx8.wait()

  const mintTx9 = await item1155.mintItem(
    0,
    2,
    await ethers.utils.parseEther('100')
  )
  await mintTx9.wait()
  console.log('mintTx successfully:')

  const mintTx10 = await item1155.mintItem(
    1,
    1,
    await ethers.utils.parseEther('200')
  )
  await mintTx10.wait()

  const mintTx = await item1155.mintItem(
    0,
    2,
    await ethers.utils.parseEther('100')
  )
  await mintTx.wait()
  console.log('mintTx successfully:')
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
