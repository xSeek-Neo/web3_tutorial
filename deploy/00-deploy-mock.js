import { DECIMAL, INITIAL_ANSWER, devlopmentChains } from '../helper-hardhat-config.js'

async function deployMock(hre) {
    const { getNamedAccounts, deployments, network } = hre

    if (devlopmentChains.includes(network.name)) {
        const { firstAccount } = await getNamedAccounts()
        const { deploy } = deployments

        await deploy('MockV3Aggregator', {
            from: firstAccount,
            args: [DECIMAL, INITIAL_ANSWER],
            log: true,
        })
    } else {
        console.log('environment is not local, mock contract depployment is skipped')
    }
}
deployMock.tags = ['all', 'mock']
export default deployMock

// npx hardhat deploy --tags mock
