import { BigNumber, Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useState, useRef } from "react";
import Web3Modal from 'web3modal'

import {
  NFT_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants"

import styles from "../styles/Home.module.css"

export default function Home() {

  const zero = BigNumber.from(0);

  const [walletConnected, setWalletConnected] = useState(false);

  const [loading, setLoading] = useState(false);

  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);

  const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] = useState(zero);

  const [tokenAmount, setTokenAmount] = useState(zero);

  const [tokensMinted, setTokensMinted] = useState(zero);

  const [isOwner, setIsOwner] = useState(false);

  const web3ModalRef = useRef();

  /**
   * getTokensToBeClaimed: checks the balance of tokens that can be claimed
   */

  const getTokensToBeClaimed = async () => {

    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      )

      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      )

      const signer = await getProviderOrSigner(true);

      const address = await signer.getAddress();

      const balance = await nftContract.balanceOf(address);

      if (balance === zero) {
        setTokensToBeClaimed(zero)
      } else {
        var amount = 0;
        for (var i = 0; i < balance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId)
          if (!claimed) {
            amount++;
          }

        }
        setTokensToBeClaimed(BigNumber.from(amount));

      }


    } catch (e) {
      console.error("Get Tokens to be claimed error", e)
      setTokensToBeClaimed(zero);
    }
  }

  /**
   * getBalanceOfCryptoDevTokens: checks the balance of Crypto Dev Tokens held by an address
   */

  const getBalanceOfCryptoDevTokens = async () => {
    try {
      const provider = await getProviderOrSigner();

      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      )

      const signer = await getProviderOrSigner(true);

      const address = await signer.getAddress();

      const balance = await tokenContract.balanceOf(address);

      setBalanceOfCryptoDevTokens(balance);



    } catch (error) {
      console.log("Getting Balance of Crypt Dev tokens", error)
      setBalanceOfCryptoDevTokens(zero);
    }
  }

  const mintCryptoDevToken = async (amount) => {
    try {
      const provider = await getProviderOrSigner(true);

      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      )

      const value = 0.00 * amount;

      const tx = tokenContract.mint(amount, {
        value: utils.parseEther(value.toString)

      });
      setLoading(true);

      await tx.wait()
      setLoading(false);
      window.alert("Successfully minted Crypto Dev Tokens")
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();

    } catch (e) {
      console.error("Mint Crypto Dev token error", e);

    }
  }

  /**
   * claimCryptoDevTokens: Helps the user claim Crypto Dev Tokens
   */

  const claimCryptoDevTokens = async () => {
    try {

      const signer = await getProviderOrSigner(true);

      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      )

      const tx = await tokenContract.claim();

      setLoading(true);

      await tx.wait()

      setLoading(false)

      window.alert("Successfully claimed Crypto Dev Tokens");

      await getBalanceOfCryptoDevTokens();

      await getTotalTokensMinted();

      await getTokensToBeClaimed();

    } catch (e) {

      console.error("Claim Crypto Dev Tokens", e);
    }
  }

  /**
   * getTotalTokensMinted: Retrieves how many tokens have been minted till now out of the max Supply
   */

  const getTotalTokensMinted = async () => {

    try {

      const provider = await getProviderOrSigner();

      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      )

      const _tokensMinted = await tokenContract.totalSupply();

      setTokensMinted(_tokensMinted);

    } catch (error) {
      console.error("Get total Totoal tokens minted", error)
    }
  }

  /**
   * getOwner: gets the contract owner by connected address
   */

  const getOwner = async () => {
    try {

      const provider = await getProviderOrSigner();

      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      )

      const _owner = await tokenContract.owner();

      const signer = await getProviderOrSigner(true);

      const address = await signer.getAddress();

      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }

    } catch (e) {

      console.error("Get Onwer", e.message)

    }
  }
  /**
   * withdrawCoins: withdraws ether and tokens by calling the withdraw function in the contract
   */

  const withdrawCoins = async () => {

    try {

      const signer = await getProviderOrSigner(true);

      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      )

      const tx = await tokenContract.withdraw();

      setLoading(true)

      await tx.wait();

      setLoading(false);

      await getOwner();
    } catch (e) {
      console.error("Withdrawal error", e);
    }
  }

  /**
   * getProviderOrSigner : Returns a Provider or Signer object representing the Ethereum RPC with or without the
     * signing capabilities of metamask attached
   */


  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();

    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();

    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby")
    }

    if (needSigner) {
      return web3Provider.getSigner();
    }

    return web3Provider;
  }

  /**
   * connectWaller: Connects the Metamask Wallet
   */

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);

    } catch (error) {
      console.error("Connect wallet", error)
    }
  }

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false
      });
      connectWallet();
      getTotalTokensMinted();
      getBalanceOfCryptoDevTokens();
      getTokensToBeClaimed();
      withdrawCoins();
    }
  }, [walletConnected]);

  /*
        renderButton: Returns a button based on the state of the dapp
      */
  const renderButton = () => {
    // If we are currently waiting for something, return a loading button
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading...</button>
        </div>
      );
    }
    // if owner is connected, withdrawCoins() is called
    if (walletConnected && isOwner) {
      return (
        <div>
          <button className={styles.button1} onClick={withdrawCoins}>
            Withdraw Coins
          </button>
        </div>
      );
    }
    // If tokens to be claimed are greater than 0, Return a claim button
    if (tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} Tokens can be claimed!
          </div>
          <button className={styles.button} onClick={claimCryptoDevTokens}>
            Claim Tokens
          </button>
        </div>
      );
    }
    // If user doesn't have any tokens to claim, show the mint button
    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"
            // BigNumber.from converts the `e.target.value` to a BigNumber
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            className={styles.input}
          />
        </div>

        <button
          className={styles.button}
          disabled={!(tokenAmount > 0)}
          onClick={() => mintCryptoDevToken(tokenAmount)}
        >
          Mint Tokens
        </button>
      </div>
    );
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs ICO!</h1>
          <div className={styles.description}>
            You can claim or mint Crypto Dev tokens here
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                You have minted {utils.formatEther(balanceOfCryptoDevTokens)} Crypto
                Dev Tokens
              </div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                Overall {utils.formatEther(tokensMinted)}/10000 have been minted!!!
              </div>
              {renderButton()}
            </div>
          ) : (
            <button onClick={connectWallet} className={styles.button}>
              Connect your wallet
            </button>
          )}
        </div>
        <div>
          <img className={styles.image} src="./0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}

