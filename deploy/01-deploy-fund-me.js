import {
    devlopmentChains,
    networkConfig,
    CONFIRMATIONS,
    DECIMAL,
    INITIAL_ANSWER,
    LOCK_TIME,
} from '../helper-hardhat-config.js'

// npx hardhat deploy --network hardhat  会执行deployFundMe函数
async function deployFundMe(hre) {
    const { deployments, getNamedAccounts, network } = hre
    const { firstAccount } = await getNamedAccounts()
    const { deploy, get } = deployments

    console.log('firstAccount is:', firstAccount)

    let dataFeedAddr
    let confirmations
    if (devlopmentChains.includes(network.name)) {
        let mockV3Aggregator
        try {
            mockV3Aggregator = await get('MockV3Aggregator')
        } catch {
            await deploy('MockV3Aggregator', {
                from: firstAccount,
                args: [DECIMAL, INITIAL_ANSWER],
                log: true,
                waitConfirmations: CONFIRMATIONS,
            })
            mockV3Aggregator = await get('MockV3Aggregator')
        }
        dataFeedAddr = mockV3Aggregator.address
        confirmations = 0
    } else {
        dataFeedAddr = networkConfig[network.config.chainId].ethUsdDataFeed
        confirmations = CONFIRMATIONS
    }

    const fundMeDeployment = await deploy('FundMe', {
        from: firstAccount,
        args: [LOCK_TIME, dataFeedAddr],
        log: true,
        waitConfirmations: confirmations,
    })

    // remove deployments directory or add --reset flag if you redeploy contract
    if (hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
        await hre.run('verify:verify', {
            address: fundMeDeployment.address,
            constructorArguments: [LOCK_TIME, dataFeedAddr],
        })
    } else {
        console.log('Network is not sepolia, verification skipped...')
    }
}
deployFundMe.tags = ['all', 'fundme']
deployFundMe.dependencies = ['MockV3Aggregator']
export default deployFundMe
