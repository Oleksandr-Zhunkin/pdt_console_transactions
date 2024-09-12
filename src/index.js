"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const readline_1 = __importDefault(require("readline"));
require("dotenv/config");
const { PRIVATE_KEY, API_KEY, CONTRACT_ETH_TO_BASE, CONTRACT_BASE_TO_ETH } = process.env;
if (!PRIVATE_KEY ||
    !API_KEY ||
    !CONTRACT_ETH_TO_BASE ||
    !CONTRACT_BASE_TO_ETH) {
    throw new Error("Not all environment variables are set");
}
// const provider = new ethers.JsonRpcProvider(
//   `https://mainnet.infura.io/v3/${API_KEY}`
// );
const provider = new ethers_1.ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${API_KEY}`);
const wallet = new ethers_1.ethers.Wallet(PRIVATE_KEY, provider);
const bridgeABI = [
    "function sendFunds(address toContract, uint256 amount) external returns (bool)",
    "event FundsTransferred(address indexed from, address indexed to, uint256 amount)",
];
const bridgeContractEthToBase = new ethers_1.ethers.Contract(CONTRACT_ETH_TO_BASE, bridgeABI, wallet);
const bridgeContractBaseToEth = new ethers_1.ethers.Contract(CONTRACT_BASE_TO_ETH, bridgeABI, wallet);
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout,
});
function sendFundsByContract(contractAddress, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const contract = new ethers_1.ethers.Contract(contractAddress, bridgeABI, wallet);
            const balance = yield provider.getBalance(wallet.address);
            console.log(`Balance: ${ethers_1.ethers.formatEther(balance)} ETH`);
            if (Number(balance) < Number(amount)) {
                console.log("You have not enough balance");
            }
            const tx = yield contract.sendFunds(wallet.address, amount);
            console.log(`Transaction hash: ${tx.hash}`);
            const receipt = yield tx.wait();
            console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
        }
        catch (error) {
            console.error("Error sending funds:", error);
        }
    });
}
function askQuestion(query) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => rl.question(query, resolve));
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const contractChoice = yield askQuestion("Choose the contract to send funds to (1 for ETH_TO_BASE, 2 for BASE_TO_ETH): ");
            let contractAddress;
            if (contractChoice === "1") {
                contractAddress = CONTRACT_ETH_TO_BASE;
            }
            else if (contractChoice === "2") {
                contractAddress = CONTRACT_BASE_TO_ETH;
            }
            else {
                console.error("Invalid choice. Exiting...");
                rl.close();
                return;
            }
            const amountStr = yield askQuestion("Enter the amount to send: ");
            const amount = ethers_1.ethers.parseEther(amountStr);
            yield sendFundsByContract(contractAddress, amount);
            console.log("Transaction completed successfully.");
        }
        catch (error) {
            console.error("Error in main function:", error);
        }
        finally {
            rl.close();
        }
    });
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
