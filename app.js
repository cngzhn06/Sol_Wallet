const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const { Connection, Keypair, clusterApiUrl, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const fs = require('fs');

const walletPath = 'wallet.json';

const loadWallet = () => {
  try {
    const data = fs.readFileSync(walletPath, 'utf-8');
    const walletInfo = JSON.parse(data);
    return Keypair.fromSecretKey(Uint8Array.from(walletInfo.secretKey));
  } catch (error) {
    const wallet = Keypair.generate();
    const walletInfo = {
      publicKey: wallet.publicKey.toBase58(),
      secretKey: Array.from(wallet.secretKey),
    };
    fs.writeFileSync(walletPath, JSON.stringify(walletInfo, null, 2));
    return wallet;
  }
};

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
let wallet = loadWallet();

const getWalletBalance = async () => {
  try {
    const balance = await connection.getBalance(wallet.publicKey);
    console.log(`Current Balance: ${balance} SOL`);
  } catch (error) {
    console.error('Error getting wallet balance:', error.toString());
  }
};

const airdropSol = async (amount = 1) => {
  try {
    const airdropAmount = amount * LAMPORTS_PER_SOL;
    await connection.requestAirdrop(wallet.publicKey, airdropAmount);
    console.log(`Airdrop successful! ${amount} SOL received.`);
  } catch (error) {
    console.error('Error requesting airdrop:', error.toString());
  }
};

const sendSol = async (destinationPublicKey, amount) => {
  try {
    const destination = new Keypair(new Uint8Array(Buffer.from(destinationPublicKey, 'base64')));
    const lamports = amount * LAMPORTS_PER_SOL;

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: destination.publicKey,
        lamports,
      })
    );

    const signature = await sendAndConfirmTransaction(connection, transaction, [wallet, destination]);
    console.log(`Transfer successful! Transaction signature: ${signature}`);
  } catch (error) {
    console.error('Error transferring SOL:', error.toString());
  }
};

const mainMenu = () => {
  console.log('\nMain Menu:');
  console.log('1. Create New Wallet');
  console.log('2. Request Airdrop');
  console.log('3. Send SOL to Address');
  console.log('4. View Balance');
  console.log('5. Exit');
  rl.question('Choose an option (1-5): ', handleUserInput);
};

const handleUserInput = async (choice) => {
  switch (choice) {
    case '1':
      wallet = loadWallet();
      console.log('New wallet created!');
      break;
    case '2':
      await airdropSol(1);
      break;
    case '3':
      rl.question('Enter destination address: ', async (destinationAddress) => {
        rl.question('Enter amount to send: ', async (amount) => {
          await sendSol(destinationAddress, parseFloat(amount));
          await getWalletBalance();
          mainMenu();
        });
      });
      return;
    case '4':
      await getWalletBalance();
      break;
    case '5':
      rl.close();
      process.exit();
    default:
      console.log('Invalid choice. Please choose a valid option.');
  }

  mainMenu();
};

mainMenu();
