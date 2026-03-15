import { expect, assert } from 'chai'
import hre from 'hardhat'
const { ethers, deployments, getNamedAccounts, network } = hre
import { LOCK_TIME, devlopmentChains } from '../../helper-hardhat-config.js'

;(devlopmentChains.includes(network.name) ? describe : describe.skip)('FundMe', async function () {
    let fundMe
    let fundMeSecondAccount
    let firstAccount

    beforeEach(async function () {
        await deployments.fixture(['all'])
        fundMe = await ethers.getContractAt('FundMe', (await deployments.get('FundMe')).address)
        const signers = await ethers.getSigners()
        fundMeSecondAccount = fundMe.connect(signers[1])
        firstAccount = (await getNamedAccounts()).firstAccount
    })
    const SEPOLIA_ETH_USD = '0x694AA1769357215DE4FAC081bf1f309aDC325306'

    it('test if the owner is msg.sender', async function () {
        // const [firstAccount] = await ethers.getSigners();
        // const fundMeFactory = await ethers.getContractFactory("FundMe");
        // const fundMe = await fundMeFactory.deploy(180);
        await fundMe.waitForDeployment()
        expect(await fundMe.owner()).to.equal(firstAccount)
    })

    it('test if the dataFeed is assigned to correctly', async function () {
        await fundMe.waitForDeployment()
        // 本地 fixture 部署的是 Mock，dataFeed 为 Mock 地址；Sepolia 上为链上价格源地址
        const expectedDataFeed =
            (await deployments.get('MockV3Aggregator').catch(() => null))?.address ?? SEPOLIA_ETH_USD
        assert.equal(await fundMe.dataFeed(), expectedDataFeed)
    })


    // fund, getFund, refund
    // unit test for fund
    // window open, value greater then minimum value, funder balance
    it('window closed, value grater than minimum, fund failed', async function () {
        const { time } = await import('@nomicfoundation/hardhat-network-helpers')
        await time.increase(LOCK_TIME + 1)
        await expect(fundMe.fund({ value: ethers.parseEther('0.1') })).to.be.revertedWith('window is closed')
    })

    it("window open, value is less than minimum, fund failed",
        async function () {
            await expect(fundMe.fund({ value: ethers.parseEther("0.01") }))
                .to.be.revertedWith("Send more ETH")
        }
    )

    it("Window open, value is greater minimum, fund success",
        async function () {
            // greater than minimum
            await fundMe.fund({ value: ethers.parseEther("0.1") })
            const balance = await fundMe.fundersToAmount(firstAccount)
            await expect(balance).to.equal(ethers.parseEther("0.1"))
        }
    )

    // unit test for getFund
    // onlyOwner, windowClose, target reached
    it('not onwer, window closed, target reached, getFund failed', async function () {
        await fundMe.fund({ value: ethers.parseEther('1') })
        const { time } = await import('@nomicfoundation/hardhat-network-helpers')
        await time.increase(LOCK_TIME + 1)
        await expect(fundMeSecondAccount.getFund()).to.be.revertedWith(
            'This function is only be called by the owner',
        )
    })

    it("window open, target reached, getFund failed",
        async function () {
            await fundMe.fund({ value: ethers.parseEther("1") })
            await expect(fundMe.getFund())
                .to.be.revertedWith("window is not closed")
        }
    )

    it('window closed, target not reached, getFund failed', async function () {
        await fundMe.fund({ value: ethers.parseEther('0.1') })
        const { time } = await import('@nomicfoundation/hardhat-network-helpers')
        await time.increase(LOCK_TIME + 1)
        await expect(fundMe.getFund()).to.be.revertedWith('Target not reached')
    })

    it('window closed, target reached, getFund success', async function () {
        await fundMe.fund({ value: ethers.parseEther('1') })
        const { time } = await import('@nomicfoundation/hardhat-network-helpers')
        await time.increase(LOCK_TIME + 1)
        await fundMe.getFund()
        expect(await fundMe.getFundSuccess()).to.equal(true)
    })

    // refund
    // windowClosed, target not reached, funder has balance
    it("window open, target not reached, funder has balance",
        async function () {
            await fundMe.fund({ value: ethers.parseEther("0.1") })
            await expect(fundMe.refund())
                .to.be.revertedWith("window is not closed");
        }
    )

    it('window closed, target reach, funder has balance', async function () {
        await fundMe.fund({ value: ethers.parseEther('1') })
        const { time } = await import('@nomicfoundation/hardhat-network-helpers')
        await time.increase(LOCK_TIME + 1)
        await expect(fundMe.refund()).to.be.revertedWith('Target is reached, refund is not allowed')
    })

    it('window closed, target not reach, funder does not has balance', async function () {
        await fundMe.fund({ value: ethers.parseEther('0.1') })
        const { time } = await import('@nomicfoundation/hardhat-network-helpers')
        await time.increase(LOCK_TIME + 1)
        await expect(fundMeSecondAccount.refund()).to.be.revertedWith('no funds to refund')
    })

    it('window closed, target not reached, funder has balance', async function () {
        await fundMe.fund({ value: ethers.parseEther('0.1') })
        const { time } = await import('@nomicfoundation/hardhat-network-helpers')
        await time.increase(LOCK_TIME + 1)
        await fundMe.refund()
        assert.equal(await fundMe.fundersToAmount(firstAccount), 0n)
    })
})
