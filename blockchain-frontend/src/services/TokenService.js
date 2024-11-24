import Web3 from 'web3';
import ERC20_ABI from '../contracts/ERC20.json';

class TokenService {
  constructor() {
    this.web3 = new Web3(window.ethereum);
    this.tokens = new Map();
  }

  async getTokenContract(tokenAddress) {
    if (!this.tokens.has(tokenAddress)) {
      const contract = new this.web3.eth.Contract(ERC20_ABI.abi, tokenAddress);
      this.tokens.set(tokenAddress, contract);
    }
    return this.tokens.get(tokenAddress);
  }

  async getTokenInfo(tokenAddress) {
    const contract = await this.getTokenContract(tokenAddress);
    const [name, symbol, decimals] = await Promise.all([
      contract.methods.name().call(),
      contract.methods.symbol().call(),
      contract.methods.decimals().call(),
    ]);
    return { name, symbol, decimals: parseInt(decimals) };
  }

  async getTokenBalance(tokenAddress, walletAddress) {
    const contract = await this.getTokenContract(tokenAddress);
    const balance = await contract.methods.balanceOf(walletAddress).call();
    const { decimals } = await this.getTokenInfo(tokenAddress);
    return this.web3.utils.fromWei(balance, 'ether');
  }

  async transferToken(tokenAddress, from, to, amount) {
    const contract = await this.getTokenContract(tokenAddress);
    const { decimals } = await this.getTokenInfo(tokenAddress);
    const amountInWei = this.web3.utils.toWei(amount.toString(), 'ether');
    
    return contract.methods.transfer(to, amountInWei).send({ from });
  }

  async getTokenTransactions(tokenAddress, walletAddress) {
    // This would typically require an external API like Etherscan
    // For demonstration, returning mock data
    return [];
  }
}

export default new TokenService(); 