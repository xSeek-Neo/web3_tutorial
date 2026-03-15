import hre from 'hardhat'

async function main() {
    const [deployer] = await hre.ethers.getSigners()
    console.log('Deploying contracts with the account:', deployer.address)

    // create factory
    const FundMeFactory = await hre.ethers.getContractFactory('FundMe')
    console.log('contract deploying...')
    // deploy contract from factory
    const fundMe = await FundMeFactory.deploy(300)

    // wait for the contract to be deployed
    await fundMe.waitForDeployment()
    // log the contract address
    console.log('contract has been deployed successfully,  contract address is:', fundMe.target)

    if (hre.network.config.chainId === 11155111 && process.env.ETHERSCAN_API_KEY) {
        // 等 5 个确认（confirmations）再跑 verify
        await fundMe.deploymentTransaction().wait(5)
        console.log('waiting for 5 confirmations...')
        // verify contract
        await verifyFundMe(fundMe.target, [300])
    } else {
        console.log('Skipping verification: Not on Sepolia or no API key')
    }
}

async function verifyFundMe(fundMeAddress, args) {
    await hre.run('verify:verify', {
        address: fundMeAddress,
        constructorArguments: args,
    })
    console.log('contract has been verified successfully')

    // init 2 accounts
    // fund contract with first and second account and inspect state
    const [account1, account2] = await hre.ethers.getSigners()
    const fundMe = await hre.ethers.getContractAt('FundMe', fundMeAddress)

    const fundAmount = hre.ethers.parseEther('0.5')

    // fund contract with first account
    const tx1 = await fundMe.connect(account1).fund({ value: fundAmount })
    await tx1.wait()
    const balanceAfterFirst = await hre.ethers.provider.getBalance(fundMeAddress)
    console.log('balance of contract after first fund:', balanceAfterFirst)

    // fund contract with second account
    const tx2 = await fundMe.connect(account2).fund({ value: fundAmount })
    await tx2.wait()
    const balanceAfterSecond = await hre.ethers.provider.getBalance(fundMeAddress)
    console.log('balance of contract after second fund:', balanceAfterSecond)

    // check mapping fundersToAmount
    const fundersToAmount1 = await fundMe.fundersToAmount(account1.address)
    console.log('fundersToAmount account1:', fundersToAmount1)

    const fundersToAmount2 = await fundMe.fundersToAmount(account2.address)
    console.log('fundersToAmount account2:', fundersToAmount2)
}

main()
    .then(() => {
        process.exit(0)
    })
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
