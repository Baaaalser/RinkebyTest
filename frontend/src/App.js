import { useState, useEffect } from 'react';
import './App.css';
// import the Calendar component
import Calendar from './components/Calendar';
import detectEthereumProvider from '@metamask/detect-provider';

function App() {
  const [account, setAccount] = useState(false);

  useEffect(() => { // esto es similiar al OnDocumentReady
    isConnected();
  }, []);

  const isConnected = async () => {
    const provider = await detectEthereumProvider();
    const accounts = await provider.request({ method: "eth_accounts" });

    if (accounts.length > 0) {
      setAccount(accounts[0]);
    } else {
      console.log("No authorized account found")
    }
  }
  
  const connect = async () => {
    try {
      const provider = await detectEthereumProvider();
      
      // returns an array of accounts
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      
      // check if array at least one element
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        alert('No account found');
      }
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>calend3</h1>
        <p id="slogan">web3 appointment scheduler</p>
      </header>
      {!account && <button onClick={connect}>connect wallet</button>}
      {account && <button>connected wallet: { account }</button>}
      {account && <Calendar account={account} />}
    </div>
  );
}

export default App;