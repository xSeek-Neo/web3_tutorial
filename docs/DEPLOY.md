# 部署与使用说明

本项目使用 [hardhat-deploy](https://github.com/wighawag/hardhat-deploy) 管理部署，部署脚本在 `deploy/` 目录。下文结合代码中的备注说明具体用法。

---

## 一、编译

修改合约后需先编译，否则部署可能用到旧的字节码（`tasks/index.js` 中也有该命令说明）：

```bash
npx hardhat compile
```

编译通过后再执行下面的部署命令。执行 `npx hardhat deploy` 时若检测到合约有变更，通常也会先自动编译。

---

## 二、部署命令汇总

### 本地网络（Hardhat）

| 命令                         | 说明                                                                                                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npx hardhat deploy`         | 在本地 Hardhat 网络执行部署。有部署记录时只部署尚未部署的合约（`01-deploy-fund-me.js` 中：会执行 deployFundMe 函数）。                                      |
| `npx hardhat deploy --reset` | 先清空当前网络的部署记录，再按顺序重新执行全部部署（Mock → FundMe），合约地址会全部更新。**需要重新部署合约时**：可删除 `deployments/` 目录或加 `--reset`。 |

### Sepolia 测试网

| 命令                                           | 说明                                                                                      |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `npx hardhat deploy --network sepolia`         | 在 Sepolia 上部署，沿用已有部署记录。                                                     |
| `npx hardhat deploy --network sepolia --reset` | 清空 Sepolia 的部署记录后重新部署全部合约，并等待 5 个区块确认后再向 Etherscan 提交验证。 |

**环境变量**（`.env`）：`SEPOLIA_RPC_URL`、`PRIVATE_KEY_1`（可选 `PRIVATE_KEY_2`）；需要自动验证时配置 `ETHERSCAN_API_KEY`。Sepolia 的 RPC 可使用 Alchemy、Infura、QuickNode 等。

---

## 三、按场景怎么用

### 1. 第一次在本地部署（开发）

```bash
npx hardhat deploy
```

- 先跑 `deploy/00-deploy-mock.js`：仅在**本地/开发链**（`hardhat`、`local`）部署 MockV3Aggregator，否则会跳过并打日志 `environment is not local, mock contract depployment is skipped`。
- 再跑 `deploy/01-deploy-fund-me.js` 部署 FundMe，本地会使用刚部署的 Mock 地址，构造函数参数来自 `helper-hardhat-config.js`（如 `LOCK_TIME`、价格源地址）。

### 2. 本地想“从头再部署一遍”

```bash
npx hardhat deploy --reset
```

或手动删掉 `deployments/` 里对应网络的目录后再执行 `npx hardhat deploy`，效果类似。

### 3. 只部署 Mock（本地）

```bash
npx hardhat deploy --tags mock
```

仅执行 `00-deploy-mock.js`（见该文件末尾备注）。

### 4. 只部署 FundMe

```bash
npx hardhat deploy --tags fundme
```

仅执行 `01-deploy-fund-me.js`。若在本地且尚未部署 Mock，脚本会先尝试获取 Mock，没有则自动部署 Mock 再部署 FundMe（见 `01-deploy-fund-me.js` 依赖与 `get('MockV3Aggregator')`）。

### 5. 部署到 Sepolia

```bash
npx hardhat deploy --network sepolia
```

- 不会部署 Mock，使用 `helper-hardhat-config.js` 里 Sepolia 的 `ethUsdDataFeed` 地址。
- 若配置了 `ETHERSCAN_API_KEY`，部署并等待确认后会自动调用 Etherscan 验证；否则会输出 `Network is not sepolia, verification skipped...` 或跳过验证。

需要“清空 Sepolia 部署记录并重部署”时：

```bash
npx hardhat deploy --network sepolia --reset
```

---

## 四、账户与配置（对应代码说明）

- **部署账户**：`hardhat.config.cjs` 里配置了 `namedAccounts`，默认 **firstAccount** 为第 0 个账户（第一个私钥），**secondAccount** 为第 1 个，Hardhat 会默认用 firstAccount 作为部署者。
- **参数来源**：`helper-hardhat-config.js` 中定义了 `LOCK_TIME`、`CONFIRMATIONS`（如 5）、各链的 `networkConfig`（如 Sepolia 的 `ethUsdDataFeed`）等，部署脚本会从这里读取。

---

## 五、Task 方式部署与交互（另一种用法）

除 `deploy/` 脚本外，项目还通过 Hardhat Task 提供一条独立部署与交互路径（见 `tasks/index.js` 注释）：

- **编译 / 查看任务**  
  `npx hardhat compile`  
  `npx hardhat tasks`

- **用 Task 部署 FundMe（示例：Sepolia）**  
  `npx hardhat deploy-fundme --network sepolia`  
  会部署并等待 5 个确认后验证，控制台会输出合约地址（示例：`0xC9153393A6E790712FC9EBeF23207736fF78720C`）。  
  注意：该 Task 使用构造函数参数 `300`，与 `deploy/01-deploy-fund-me.js` 使用的 `LOCK_TIME`（如 180）可能不同。

- **与已部署的 FundMe 合约交互**  
  `npx hardhat interact-fundme --addr <合约地址> --network sepolia`  
  会用两个账户各向合约充值 0.5 ETH，并打印合约余额与两账户在合约中的记录（对应 `tasks/interact-fundme.js` 逻辑）。

---

## 六、手动验证合约（hardhat.config.cjs 注释示例）

未在部署脚本中自动验证时，可单独执行：

```bash
# 主网示例
npx hardhat verify --network mainnet DEPLOYED_CONTRACT_ADDRESS "10"

# Sepolia 示例（地址与构造参数按实际替换）
npx hardhat verify --network sepolia 0x8B0F034742C83D73164dfB7b7DfaFE8a38C3A470 "300"
```

将 `DEPLOYED_CONTRACT_ADDRESS` 和构造参数换成你本次部署的地址与 FundMe 构造函数参数（如 `LOCK_TIME` 或 300，与部署时一致）。
