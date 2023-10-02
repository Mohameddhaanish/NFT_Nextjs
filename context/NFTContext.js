import React, { useEffect, useState } from 'react';
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';
import axios from 'axios';
import { MarketAddress, MarketAddressABI } from './constants';
import { NFTStorage, Blob } from 'nft.storage'
const NFT_STORAGE_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweEQwYzg5M2M2MDQ0RDdEQkVDY0QwZjFmZkY1N0MxOEUyRWQ2M2E5OGUiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY5NjAxMjU0MzI2NywibmFtZSI6ImRoYWFuaXNoIE5GVCJ9.-UeL5dOS6brKtVsZcRA8svqAzrIs1MpvlbX1kZZUnUc"
const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });

const fetchContract = (signerOrProvider) => new ethers.Contract(MarketAddress, MarketAddressABI, signerOrProvider);

export const NFTContext = React.createContext();

export const NFTProvider = ({ children }) => {
  const nftCurrency = 'Goerli';
  const [currentAccount, setCurrentAccount] = useState('');

  const connectWallet = async () => {
    if (!window.ethereum) return alert('Please install MetaMask.');

    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    setCurrentAccount(accounts[0]);
    window.location.reload();
  };

  const checkIfWalletIsConnect = async () => {
    if (!window.ethereum) return alert('Please install MetaMask.');

    const accounts = await window.ethereum.request({ method: 'eth_accounts' });

    if (accounts.length) {
      setCurrentAccount(accounts[0]);
    } else {
      console.log('No accounts found');
    }
  };

  const uploadToIPFS = async (file) => {
    try {
      const metadata = await client.store({
        name: "ABC",
        description: "ABC",
        image: file
      })

      return metadata.data.image.href;
    } catch (error) {
      console.log('Error uploading to file');
    }
  };
  async function uploadMetadataToIPFS() {
    const { name, description, price } = formParams;

    if (!name || !description || !price || !fileURL) {
      updateMessage("Please fill all the fields!");
      return -1;
    }

    const nftJSON = {
      name,
      description,
      price,
      image: fileURL,
    };

    try {
      const response = await uploadJSONToIPFS(nftJSON);
      if (response.success === true) {
        console.log("Uploaded JSON to Pinata: ", response);
        return response.pinataURL;
      }
    } catch (e) {
      console.log("error uploading JSON metadata:", e);
    }
  }
  const createNFT = async (formInput, fileUrl, router) => {
    const { name, description, price } = formInput;
    if (!name || !description || !fileUrl || !price) return;
    const data = JSON.stringify({
      name, description, image: fileUrl,
    });
console.log("Data==>",data);
    try {
      // const metadata = new Blob([data]);
      // const cid = await client.storeBlob(metadata);
      // const url = "https://ipfs.io/ipfs/" + cid;


      await createSale(fileUrl, price);

      router.push('/');
    } catch (error) {
      console.log('Error uploading to create nft==>',error);
    }
  };

  const createSale = async (url, formInputPrice, isReselling, id) => {
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
console.log("formInputPrice==>",formInputPrice);
    const price = ethers.utils.parseUnits(formInputPrice, 'ether');
    console.log("price==>",price.toString());
    const contract = fetchContract(signer);
    console.log("Contract==>",contract);
    const listingPrice = await contract.getListingPrice();
console.log("listingprice==>",listingPrice.toString());
    const transaction = !isReselling
      ? await contract.createToken(url, price, { value: listingPrice.toString() })
      : await contract.resellToken(id, price, { value: listingPrice.toString() });
    await transaction.wait();
  };
   const GetIpfsUrlFromPinata = (pinataUrl) => {
    var IPFSUrl = pinataUrl.split("/");
    const lastIndex = IPFSUrl.length;
    IPFSUrl = "https://ipfs.io/ipfs/"+IPFSUrl[lastIndex-1];
    return IPFSUrl;
};
  const fetchNFTs = async (setLoading) => {
    setLoading(true)
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = fetchContract(provider);

    const data = await contract.fetchMarketItems();

    const items = await Promise.all(data.map(
      async ({ tokenId, seller, owner, price: unformattedPrice }) => {
        const tokenURI = await contract.tokenURI(tokenId);
        tokenURI=GetIpfsUrlFromPinata(tokenURI);
        const { data: { image, name, description } } = await axios.get(tokenURI);
        const price = ethers.utils.formatUnits(unformattedPrice.toString(), 'ether');
        console.log("Tokenuri",tokenURI);
     

        return {
          price,
          tokenId: tokenId.toNumber(),
          seller,
          owner,
          image,
          name,
          description,
          tokenURI,
        };
      },
    ));
    return items;
  };

  const fetchMyNFTsOrListedNFTs = async (type) => {
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const contract = fetchContract(signer);

    const data = type === 'fetchItemsListed'
      ? await contract.fetchItemsListed()
      : await contract.fetchMyNFTs();

    const items = await Promise.all(data.map(
      async ({ tokenId, seller, owner, price: unformattedPrice }) => {
        const tokenURI = await contract.tokenURI(tokenId);
console.log("tokenid",tokenId);
        console.log("tokenurl",tokenURI);
        tokenURI=GetIpfsUrlFromPinata(tokenURI)
        const { data: { image, name, description } } = await axios.get(tokenURI);
        const price = ethers.utils.formatUnits(unformattedPrice.toString(), 'ether');
console.log("fetchmynft price==>",price.toString());
        return {
          price,
          tokenId: tokenId.toNumber(),
          seller,
          owner,
          image,
          name,
          description,
          tokenURI,
        };
      },
    ));

    return items;
  };

  const buyNFT = async (nft) => {
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const contract = fetchContract(signer);

    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether');

    const transaction = await contract.createMarketSale(nft.tokenId, { value: price });

    await transaction.wait();
  };
  useEffect(() => {
    checkIfWalletIsConnect();
  }, []);
  return (
    <NFTContext.Provider
      value={{
        nftCurrency,
        connectWallet,
        currentAccount,
        uploadToIPFS,
        createNFT,
        fetchNFTs,
        fetchMyNFTsOrListedNFTs,
        buyNFT,
        createSale,
        GetIpfsUrlFromPinata
      }}
    >
      {children}
    </NFTContext.Provider>
  );
};
