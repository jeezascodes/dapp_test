import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import DaiToken from '../abis/DaiToken.json';
import DappToken from '../abis/DappToken.json';
import TokenFarm from '../abis/TokenFarm.json';
import Navbar from './Navbar';
import Main from './Main';
import './App.css';

const App = ({}) => {
  const [account, setAccount] = useState('0x0');
  const [daiToken, setdaiToken] = useState({});
  const [dappToken, setdappToken] = useState({});
  const [tokenFarm, settokenFarm] = useState({});
  const [daiTokenBalance, setdaiTokenBalance] = useState('0');
  const [dappTokenBalance, setdappTokenBalance] = useState('0');
  const [stakingBalance, setstakingBalance] = useState('0');
  const [loading, setloading] = useState(true);

  async function loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        'Non-Ethereum browser detected. You should consider trying MetaMask!'
      );
    }
  }

  const loadBlockchainData = async () => {
    const web3 = await window.web3;
    const accounts = await web3.eth.getAccounts();
    setAccount(accounts[0]);

    const networkId = await web3.eth.net.getId();

    //load dai token
    const daiTokenData = DaiToken.networks[networkId];
    if (daiTokenData) {
      const daiToken = new web3.eth.Contract(
        DaiToken.abi,
        daiTokenData.address
      );
      setdaiToken(daiToken);
      let daiTokenBalance = await daiToken.methods
        .balanceOf(accounts[0])
        .call();
      setdaiTokenBalance(daiTokenBalance.toString());
    } else {
      window.alert('DaiToken contract not deployed to detected network.');
    }

    const dappTokenData = DappToken.networks[networkId];
    if (dappTokenData) {
      const dappToken = new web3.eth.Contract(
        DappToken.abi,
        dappTokenData.address
      );
      setdappToken(dappToken);
      let dappTokenBalance = await dappToken.methods
        .balanceOf(accounts[0])
        .call();
      setdappTokenBalance(dappTokenBalance.toString());
    } else {
      window.alert('DappToken contract not deployed to detected network.');
    }

    // Load TokenFarm
    const tokenFarmData = TokenFarm.networks[networkId];

    if (tokenFarmData) {
      const tokenFarm = new web3.eth.Contract(
        TokenFarm.abi,
        tokenFarmData.address
      );
      settokenFarm(tokenFarm);
      let stakingBalance = await tokenFarm.methods
        .stakingBalance(accounts[0])
        .call();
      setstakingBalance(stakingBalance.toString());
    } else {
      window.alert('TokenFarm contract not deployed to detected network.');
    }

    setloading(false);
  };

  useEffect(() => {
    async function initializeApp() {
      await loadWeb3();
      await loadBlockchainData();
    }
    initializeApp();
    return () => {};
  }, []);

  const stakeTokens = (amount) => {
    setloading(true);
    daiToken.methods
      .approve(tokenFarm._address, amount)
      .send({ from: account })
      .on('transactionHash', (hash) => {
        tokenFarm.methods
          .stakeTokens(amount)
          .send({ from: account })
          .on('transactionHash', (hash) => {
            setloading(false);
          });
      });
  };

  const unstakeTokens = () => {
    setloading(true);
    tokenFarm.methods
      .unstakeTokens()
      .send({ from: account })
      .on('transactionHash', (hash) => {
        setloading(false);
      });
  };

  function getContent() {
    if (loading) {
      return (
        <p id='loader' className='text-center'>
          Loading...
        </p>
      );
    } else {
      return (
        <Main
          daiTokenBalance={daiTokenBalance}
          dappTokenBalance={dappTokenBalance}
          stakingBalance={stakingBalance}
          stakeTokens={stakeTokens}
          unstakeTokens={unstakeTokens}
        />
      );
    }
  }

  return (
    <div>
      <Navbar account={account} />
      <div className='container-fluid mt-5'>
        <div className='row'>
          <main
            role='main'
            className='col-lg-12 ml-auto mr-auto'
            style={{ maxWidth: '600px' }}
          >
            <div className='content mr-auto ml-auto'>
              <a
                href='http://www.dappuniversity.com/bootcamp'
                target='_blank'
                rel='noopener noreferrer'
              ></a>

              {getContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
