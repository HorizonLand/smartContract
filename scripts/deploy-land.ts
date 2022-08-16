import { ethers } from 'hardhat'
import { MarketToken, Land, MarketHorizonLand } from 'types'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from 'ethers'
let Chance = require('chance')
async function main() {
  let priceItemDefault: BigNumber = ethers.utils.parseUnits('100', 'ether')
  let approveAmount: BigNumber = ethers.utils.parseUnits('100000000', 'ether')
  let amountOfferDefault: BigNumber = ethers.utils.parseUnits('50', 'ether')
  let [owner, accountImport, account33e]: SignerWithAddress[] = await ethers.getSigners()
  // console.log(owner.address);
  // console.log(accountImport.address);
  // console.log(account33e.address);
  
  var chance = new Chance()

  let marketToken: MarketToken
  let marketLand: MarketHorizonLand
  let land: Land

 marketToken = await ethers.getContractAt('MarketToken', '0x2E630E6499e65DF5811D6f122Ba139Cd91F28f52')

  // const MarketToken = await ethers.getContractFactory('MarketToken')
  // marketToken = await MarketToken.deploy()
  // await marketToken.deployed()
  
  const Land = await ethers.getContractFactory('Land')
  land = await Land.deploy()
  await land.deployed()
  console.log('land deployed to:', land.address)

  const MarketLand = await ethers.getContractFactory('MarketHorizonLand')
  marketLand = await MarketLand.deploy(marketToken.address, '0x6912b37722151dc858d6ee8B69c032b37473cD95', land.address)
  await marketLand.deployed()
  console.log('marketLand deployed to:', marketLand.address)
  await (await land.grantRole('0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6', marketLand.address)).wait()
  await land.connect(account33e).setApprovalForAll(marketLand.address, true)
  await land.connect(accountImport).setApprovalForAll(marketLand.address, true)
  await land.connect(owner).setApprovalForAll(marketLand.address, true)
  await (await marketToken.connect(account33e).approve(marketLand.address, approveAmount)).wait()
  await (await marketToken.connect(accountImport).approve(marketLand.address, approveAmount)).wait()
  for (let i = 0; i < 8; i++) {
    let isCanceled: boolean = chance.bool()
    let defaultX: BigNumber = BigNumber.from(chance.integer({ min: 0, max: 1000 }))
    let defaultY: BigNumber = BigNumber.from(chance.integer({ min: 0, max: 1000 }))
    await (await marketLand.mintByAdmin(defaultX, defaultY, accountImport.address)).wait()
    console.log("mint by admin ok");
    sleep(10000)
    await (await marketLand.connect(accountImport).resellTokenId(defaultX, defaultY, priceItemDefault)).wait()
    console.log("resell ok");
    sleep(10000)
    
    if (isCanceled) {
      const cancelTx = await marketLand.connect(accountImport).cancelSale(defaultX, defaultY)
      await cancelTx.wait()
      console.log("cancel ok");
      continue
    }
    sleep(10000)
    const buyTX = await marketLand.connect(account33e).buyNFTisSale(defaultX, defaultY)
    await buyTX.wait()
    console.log("buy ok");

  }
  for (let i = 0; i < 8; i++) {
    let isAdminSell: boolean = chance.bool()
    let defaultX: BigNumber = BigNumber.from(chance.integer({ min: 0, max: 1000 }))
    let defaultY: BigNumber = BigNumber.from(chance.integer({ min: 0, max: 1000 }))
    if (isAdminSell) {
      await (await marketLand.setPriceForTokenId(defaultX, defaultY, priceItemDefault)).wait()
    } else {
      await (await marketLand.mintByAdmin(defaultX, defaultY, accountImport.address)).wait()
    sleep(10000)
    await (await marketLand.connect(accountImport).resellTokenId(defaultX, defaultY, priceItemDefault)).wait()
    }
    console.log("sell 2 ok");
    sleep(10000)

    const offerTx = await marketLand.connect(account33e).offerLand(defaultX, defaultY, amountOfferDefault)
    await offerTx.wait()
    sleep(10000)
    const offerTx2 = await marketLand.connect(account33e).offerLand(defaultX, defaultY, amountOfferDefault.add(1))
    await offerTx2.wait()
    sleep(10000)
    const offerTx3 = await marketLand.connect(account33e).offerLand(defaultX, defaultY, amountOfferDefault.add(1))
    await offerTx3.wait()
    if(isAdminSell){
    sleep(10000)
    await (await marketLand.selectOfferWhenAdminSale(defaultX, defaultY, 1)).wait()
    }
    else{
    sleep(10000)
    await (await marketLand.connect(accountImport).selectOfferbyUser(defaultX, defaultY, 1)).wait()
    }
    console.log("offer 2 ok");

    sleep(10000)
    const refundTx = await marketLand.connect(account33e).refundOffer(defaultX, defaultY, 1, 2)
   await refundTx.wait()
   console.log("refund 2 ok");

  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  function sleep(milliseconds :Number) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
      if ((new Date().getTime() - start) > milliseconds){
        break;
      }
    }
  }