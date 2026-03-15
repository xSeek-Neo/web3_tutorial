import { expect, assert } from 'chai'
import hre from 'hardhat'
const { ethers, deployments, getNamedAccounts } = hre

describe('FundMe', async function () {
    let fundMe
    let firstAccount

    beforeEach(async function () {
        await deployments.fixture(['all'])
        fundMe = await ethers.getContractAt('FundMe', (await deployments.get('FundMe')).address)

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
        // const fundMeFactory = await ethers.getContractFactory("FundMe");
        // const fundMe = await fundMeFactory.deploy(180);
        await fundMe.waitForDeployment()

        assert.equal(await fundMe.dataFeed(), SEPOLIA_ETH_USD)
    })
})
