import fs from "fs";
import path from "path";
import { ethers } from "ethers";
import chalk from "chalk";
import cliProgress from "cli-progress";
import { setTimeout as sleep } from "timers/promises";

const pkFile = path.resolve("./pk.txt");
if (!fs.existsSync(pkFile)) {
  console.error("❌ File pk.txt tidak ditemukan!");
  process.exit(1);
}

const [RPC_URL, PRIVATE_KEY] = fs.readFileSync(pkFile, "utf-8")
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(Boolean);

if (!RPC_URL || !PRIVATE_KEY) {
  console.error("❌ Format pk.txt salah! Harus ada 2 baris: RPC URL dan Private Key");
  process.exit(1);
}

const abiFile = path.resolve("./abi.json");
if (!fs.existsSync(abiFile)) {
  console.error("❌ File abi.json tidak ditemukan!");
  process.exit(1);
}

const abiJSON = JSON.parse(fs.readFileSync(abiFile, "utf-8"));
const ROUTER_ABI = abiJSON.ROUTER_ABI;
const ERC20_ABI = abiJSON.ERC20_ABI;

const ROUTER_ADDRESS = "0xb95B5953FF8ee5D5d9818CdbEfE363ff2191318c"; 
const USDT_ADDRESS = "0x3ec8a8705be1d5ca90066b37ba62c4183b024ebf";
const ETH_ADDRESS = "0x0fe9b43625fa7edd663adcec0728dd635e4abf7c";
const BTC_ADDRESS = "0x36f6414ff1df609214ddaba71c84f18bcf00f67d";

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const PAIRS = [
  {
    from: ETH_ADDRESS,
    to: USDT_ADDRESS,
    fromSymbol: "ETH",
    toSymbol: "USDT",
    decimals: 18,
    minBalance: 0.005,
  },
  {
    from: USDT_ADDRESS,
    to: ETH_ADDRESS,
    fromSymbol: "USDT",
    toSymbol: "ETH",
    decimals: 18,
    minBalance: 10,
  },
  {
    from: BTC_ADDRESS,
    to: USDT_ADDRESS,
    fromSymbol: "BTC",
    toSymbol: "USDT",
    decimals: 8,
    minBalance: 0.0005,
  },
  {
    from: USDT_ADDRESS,
    to: BTC_ADDRESS,
    fromSymbol: "USDT",
    toSymbol: "BTC",
    decimals: 18,
    minBalance: 10,
  },
];

async function getRandomPair() {
  return PAIRS[Math.floor(Math.random() * PAIRS.length)];
}

async function getBalance(tokenAddress) {
  if (tokenAddress === "native") {
    return provider.getBalance(wallet.address);
  }
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  return contract.balanceOf(wallet.address);
}

async function calculateSafeAmount(pair) {
  const balance = await getBalance(pair.from);
  const balanceInUnits = Number(ethers.formatUnits(balance, pair.decimals));

  const available = Math.max(balanceInUnits - pair.minBalance, 0);
  if (available <= 0) return null;

  const percentage = Math.random() * 0.4 + 0.3;
  const amount = available * percentage;

  return ethers.parseUnits(amount.toFixed(pair.decimals), pair.decimals);
}

async function approveIfNeeded(tokenAddress, amount) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
  const allowance = await tokenContract.allowance(wallet.address, ROUTER_ADDRESS);

  if (allowance < amount) {
    console.log(chalk.yellow(`⚠️ Approving ${ethers.formatUnits(amount, 18)} tokens...`));
    const tx = await tokenContract.approve(ROUTER_ADDRESS, amount);
    await tx.wait();
    console.log(chalk.green("✅ Approval success!"));
  }
}

async function executeSwap(pair, amount) {
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);

  const swapParams = {
    tokenIn: pair.from,
    tokenOut: pair.to,
    fee: 3000,
    recipient: wallet.address,
    deadline: Math.floor(Date.now() / 1000) + 300,
    amountIn: amount,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  };

  console.log(chalk.cyanBright(`\n🔄 Menukar ${ethers.formatUnits(amount, pair.decimals)} ${pair.fromSymbol} ➔ ${pair.toSymbol}`));

  const tx = await router.exactInputSingle(swapParams, {
    gasLimit: 150000,
  });

  console.log(chalk.blueBright(`📤 Transaksi dikirim: ${tx.hash}`));
  console.log(chalk.blueBright(`🔗 Explorer: https://chainscan-galileo.0g.ai/tx/${tx.hash}`));

  const receipt = await tx.wait();
  console.log(chalk.green("✅ Swap berhasil!\n"));
}

async function humanDelay() {
  const delay = Math.floor(Math.random() * (90000 - 30000) + 30000); 
  const bar = new cliProgress.SingleBar({
    format: 'Menunggu [{bar}] {percentage}% | {value}s / {total}s',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });
  bar.start(Math.round(delay / 1000), 0);

  for (let i = 1; i <= delay / 1000; i++) {
    await sleep(1000);
    bar.update(i);
  }

  bar.stop();
}

function printBanner() {
  console.log(chalk.magentaBright("Ready for OGLABS to swap... LFG!\n"));
}

async function main() {
  printBanner();
  console.log(chalk.greenBright("Memulai auto swap acak...\n"));

  while (true) {
    try {
      const pair = await getRandomPair();
      const amount = await calculateSafeAmount(pair);

      if (!amount) {
        console.log(chalk.red(`Saldo ${pair.fromSymbol} terlalu rendah, mencoba pair lain...`));
        await humanDelay();
        continue;
      }

      await approveIfNeeded(pair.from, amount);
      await executeSwap(pair, amount);
      await humanDelay();
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      console.log(chalk.yellow("Mencoba lagi setelah delay..."));
      await humanDelay();
    }
  }
}

main();
