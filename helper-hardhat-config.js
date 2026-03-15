export const DECIMAL = 8
export const INITIAL_ANSWER = 300000000000
export const devlopmentChains = ['hardhat', 'local']
export const LOCK_TIME = 180
export const CONFIRMATIONS = 5
/** 动态 gas 溢价比例（避免 REPLACEMENT_UNDERPRICED） */
export const GAS_PRICE_BUMP_PERCENT = 30

/**
 * 获取链上当前 gas 并加溢价，用于发交易时覆盖。返回 { gasPrice }（Number，兼容 Hardhat 内部 ethers v5）。
 * @param {import('ethers').Provider} provider
 * @param {import('hardhat/types').NetworkConfig} [networkConfig]
 * @returns {Promise<{ gasPrice?: number }>}
 */
export async function getGasOverrides(provider, networkConfig) {
    const configured = networkConfig?.gasPrice
    try {
        const fee = await provider.getFeeData()
        const current = fee.gasPrice ?? (fee.maxFeePerGas ? fee.maxFeePerGas + (fee.maxPriorityFeePerGas ?? 0n) : null)
        const base = current ?? (typeof configured === 'number' ? BigInt(configured) : undefined)
        if (base === undefined || base === null) return configured != null ? { gasPrice: Number(configured) } : {}
        const bumped = (base * BigInt(100 + GAS_PRICE_BUMP_PERCENT)) / 100n
        const gasPriceBig = configured != null ? (bumped > BigInt(configured) ? bumped : BigInt(configured)) : bumped
        return { gasPrice: Number(gasPriceBig) }
    } catch {
        return configured != null ? { gasPrice: Number(configured) } : {}
    }
}

export const networkConfig = {
    11155111: {
        ethUsdDataFeed: '0x694AA1769357215DE4FAC081bf1f309aDC325306',
    },
    97: {
        ethUsdDataFeed: '0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7',
    },
}
