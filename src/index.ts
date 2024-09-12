import { ethers } from "ethers";
import readline from "readline";
import "dotenv/config";

const { PRIVATE_KEY, API_KEY, CONTRACT_ETH_TO_BASE, CONTRACT_BASE_TO_ETH } =
  process.env;

if (
  !PRIVATE_KEY ||
  !API_KEY ||
  !CONTRACT_ETH_TO_BASE ||
  !CONTRACT_BASE_TO_ETH
) {
  throw new Error("Not all environment variables are setting");
}

// const provider = new ethers.JsonRpcProvider(
//   `https://mainnet.infura.io/v3/${API_KEY}`
// );
const provider = new ethers.JsonRpcProvider(
  `https://sepolia.infura.io/v3/${API_KEY}`
);

const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const bridgeABI = [
  "function sendFunds(address toContract, uint256 amount) external returns (bool)",
  "event FundsTransferred(address indexed from, address indexed to, uint256 amount)",
];

const bridgeContractEthToBase = new ethers.Contract(
  CONTRACT_ETH_TO_BASE,
  bridgeABI,
  wallet
);
const bridgeContractBaseToEth = new ethers.Contract(
  CONTRACT_BASE_TO_ETH,
  bridgeABI,
  wallet
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function sendFundsByContract(
  contractAddress: string,
  amount: ethers.BigNumberish
) {
  try {
    const contract = new ethers.Contract(contractAddress, bridgeABI, wallet);

    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

    if (Number(balance) < Number(amount)) {
      console.log("You have not enough balance");
    }

    const tx = await contract.sendFunds(wallet.address, amount);
    console.log(`Transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
  } catch (error) {
    console.error("Error sending funds:", error);
  }
}

async function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  try {
    const contractChoice = await askQuestion(
      "Choose the contract to send funds to (1 for ETH_TO_BASE, 2 for BASE_TO_ETH): "
    );
    let contractAddress: string;

    if (contractChoice === "1") {
      contractAddress = CONTRACT_ETH_TO_BASE!;
    } else if (contractChoice === "2") {
      contractAddress = CONTRACT_BASE_TO_ETH!;
    } else {
      console.error("Invalid choice. Exiting...");
      rl.close();
      return;
    }

    const amountStr = await askQuestion("Enter the amount to send: ");
    const amount = ethers.parseEther(amountStr);

    await sendFundsByContract(contractAddress, amount);
    console.log("Transaction completed successfully.");
  } catch (error) {
    console.error("Error in main function:", error);
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
