import hre from 'hardhat'
import { assert, expect } from 'chai'
import { devlopmentChains, getGasOverrides } from '../../helper-hardhat-config.js'

const { ethers, deployments, getNamedAccounts, network } = hre

async function getTxOverrides(multiplier = 1) {
    const provider = ethers.provider
    const gas = await getGasOverrides(provider, network.config)
    if (multiplier !== 1 && gas.gasPrice) gas.gasPrice = Math.ceil(gas.gasPrice * multiplier)
    return gas
}

/** 发交易，若遇 REPLACEMENT_UNDERPRICED 则用更高 gas 重试一次 */
async function sendWithRetry(sendFn) {
    try {
        return await sendFn(await getTxOverrides())
    } catch (e) {
        if (e?.code !== 'REPLACEMENT_UNDERPRICED' && e?.reason !== 'replacement fee too low') throw e
        return await sendFn(await getTxOverrides(2))
    }
}

;(devlopmentChains.includes(network.name) ? describe.skip : describe)('test fundme contract', async function () {
    let fundMe
    let firstAccount

    this.timeout(300_000)
    beforeEach(async function () {
        this.timeout(120_000)
        await deployments.fixture(['all'])
        firstAccount = (await getNamedAccounts()).firstAccount
        const fundMeDeployment = await deployments.get('FundMe')
        fundMe = await ethers.getContractAt('FundMe', fundMeDeployment.address)
    })

    // test fund and getFund successfully (1 ETH 确保达到 TARGET 1000 USD，避免价格波动导致 "Target not reached")
    it('fund and getFund successfully', async function () {
        const fundTx = await sendWithRetry((gas) => fundMe.fund({ value: ethers.parseEther('1'), ...gas }))
        await fundTx.wait()
        // make sure window closed
        await new Promise((resolve) => setTimeout(resolve, 181 * 1000))
        const getFundTx = await sendWithRetry((gas) => fundMe.getFund(gas))
        await getFundTx.wait()
        expect(await fundMe.getFundSuccess()).to.equal(true)
    })

    // test fund and refund successfully
    it('fund and refund successfully', async function () {
        const fundTx = await sendWithRetry((gas) => fundMe.fund({ value: ethers.parseEther('0.1'), ...gas }))
        await fundTx.wait()
        // make sure window closed
        await new Promise((resolve) => setTimeout(resolve, 181 * 1000))
        const refundTx = await sendWithRetry((gas) => fundMe.refund(gas))
        await refundTx.wait()
        assert.equal(await fundMe.fundersToAmount(firstAccount), 0n)
    })
})
