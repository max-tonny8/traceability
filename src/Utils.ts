import { MNID as mnid } from '@nullbeam/mnid';
import { ethers } from "ethers";
import moment from 'moment';
const EthLib = require('eth-lib');
const Web3Utils = require('web3-utils');
const CryptoJS = require('crypto-js');

export class Utils {
    
    /**
     * @description Validate if a given value is a mnid
     * @param value Value to validate as mnid
     */
    static isMnid(value: string): boolean {
        return mnid.isMNID(value);
    }

    /**
     * @description Convert a given value to hexadecimal
     * @param value Value to convert
     */
    static toHex(value: any): string {
        return Web3Utils.toHex(value);
    }

    /**
     * @description Converts a value to Hexadecimal
     * @param value Value to convert to Hex
     * @param length Length of the output
     */
    static asciiToHex(value: string, length: number): string {
        return Web3Utils.asciiToHex(value, length);
    }

    /**
     * @description Convert a given number to hexadecimal
     * @param value Number to convert
     */
    static numberToHex(value: number | string): string {
        return Web3Utils.numberToHex(value);
    }

    /**
     * @description Calculate a hash from a data
     * @param data Data to calculate its hash
     */
    static calculateHash(data: any): string {
        const dataString = typeof data === 'string' ? data : JSON.stringify(data);
        return '0x' + CryptoJS.SHA256(dataString).toString(CryptoJS.enc.Hex);
    }

    /**
     * @description Get the equivalent address of the private key
     * @param privateKey Private key to get its public address
     */
    static privateToAddress(privateKey: string): string {
        return EthLib.Account.fromPrivate(privateKey).address;
    }

    /**
     * @description Generate a random hexadecimal
     */
    static generateObjectId(): string {
        var timestamp = ((new Date().getTime() / 1000) | 0).toString(16);
        return (
            timestamp +
            'xxxxxxxxxxxxxxxx'
                .replace(/[x]/g, function () {
                    return ((Math.random() * 16) | 0).toString(16);
                })
                .toLowerCase()
        );
    }

    /**
     * @description Execute a function and wait until an event is called
     * @param fx Function to execute
     * @param eventName Event name to wait
     */
    static waitForEventName(fx: Function, eventName: string): Promise<string> {
        return new Promise((resolve, reject) => {
            fx()
            .once(eventName, (hash: string) => {
                resolve(hash)
            })
            .on('error', (error: Error) => {
                reject(error)
            });
        });
    }

    /**
     * @description Filters an ABI to get a specific ABI only with certain events names
     * @param abi ABI to filter
     * @param eventName List of event name to filter
     */
    static getABIEvent(abi: any, eventName: string[] = []) {
        return abi.filter((item: any) => item.type === 'event' && eventName.includes(item.name));
    }
    
    /**
     * @description Validate that the current date is less than a given date
     * @param date Date to validate
     */
    static isNowBeforeDate(date: string): boolean {
        return moment().isBefore(date);
    }

    /**
     * @description Validate that the current date is in the range of two given dates
     * @param firstDate Start date
     * @param secondDate End date
     */
    static isNowBetweenDates(firstDate: string, secondDate: string): boolean {
        return moment().isBetween(firstDate, secondDate);
    }

    /**
     * @description Validates if the current date is greater than or equal to the given date
     * @param date Date to validate
     */
     static isNowSameOrAfterDate(date: string): boolean {
        return moment().isSameOrAfter(date);
    }

    /**
     * @description Validate a list of rules about an object
     * @param rule Rules to validate about the object
     * @param obj Object to validate
     */
    static validateKeys(rule: any, obj: {[key: string]: any}): boolean {
        const reducers: any = {
            $and: (acc: any, val: any) => acc && val,
            $or: (acc: any, val: any) => acc || val,
        };
        const [ruleType] = Object.keys(rule);
        if (ruleType !== '$not' && (!Array.isArray(rule[ruleType]) || !rule[ruleType].length)) throw new Error('invalid rule');
        return ruleType === '$not'
          ? !Utils.validateKeys(rule['$not'], obj)
          : rule[ruleType]
            .map(
                (r: any) =>
                    typeof r === 'string'
                    ? obj[r] !== undefined && obj[r] !== null
                    : Utils.validateKeys(r, obj),
                )
            .reduce(reducers[ruleType], ruleType === '$and');
    };

    static async estimateGas(web3: any, from: string, data: string, to: string): Promise<any> {
        try {
            return await web3.eth.estimateGas({ from, data, to });
        } catch (error: any) {
            throw error.message;
        }
    }

    static async signTransaction(privateKey: string, rawTx: object): Promise<string> {
        const wallet = new ethers.Wallet(privateKey);
        return await wallet.signTransaction(rawTx);
    }

    static async sendRawTransaction(web3: any, privateKey: string, rawTx: object): Promise<{[key: string]: any}> {
        const signedTx = await Utils.signTransaction(privateKey, rawTx);
        const txHash = await Utils.waitForEventName(() => web3.eth.sendSignedTransaction(signedTx), 'transactionHash');
        const receipt = await Utils.waitForTransactionReceipt(web3, txHash);
        console.info(JSON.stringify(receipt, null, ' '));
        return receipt;
    }

    static waitForTransactionReceipt(web3: any, txHash: string, _tries = 30): Promise<{[key: string]: any}> {
        return new Promise((resolve, reject) => {
            var tries = _tries;
            var interval = setInterval(() => {
            web3.eth.getTransactionReceipt(
                txHash,
                (error: Error, txReceipt?: {[key: string]: any}) => {
                    if (error) {
                        clearInterval(interval);
                        reject(error);
                    } else {
                        if (txReceipt && txReceipt['transactionHash'] == txHash && txReceipt['blockNumber']) {
                            clearInterval(interval);
                            resolve(txReceipt);
                        } else if (tries > 0) {
                            tries--;
                        } else {
                            clearInterval(interval);
                            reject(txReceipt);
                        }
                    }
                }
            )}, 1000);
        });
    }

    static async sendTransaction(web3: any, privateKey: string, toContract: string, methodToExecute: {[key: string]: any}, value: number = 0): Promise<{[key: string]: any}> {
        const address = Utils.privateToAddress(privateKey);
        const totalTransactionsAddress = await web3.eth.getTransactionCount(address);
        const data = methodToExecute.encodeABI();
        const gasEstimated = await Utils.estimateGas(web3, address, data, toContract);
        const gasLimit = Math.round(gasEstimated * 2);
        const cost = Math.round((gasLimit * 9500000000) + value);
        const balance = await web3.eth.getBalance(address);
        if(balance < cost) {
            throw `Gas Price: 9500000000\nGas Cost: ${cost}\nBalance: ${balance}`;
        }
        const rawTx: any = {
            from: address,
            gasPrice: Utils.toHex(9500000000),
            gasLimit: Utils.toHex(gasLimit),
            nonce: Utils.toHex(totalTransactionsAddress),
            data,
            to: toContract,
            value: Utils.toHex(value)
        };
        rawTx.chainId = 80001;
        const receipt = await Utils.sendRawTransaction(web3, privateKey, rawTx);
        return receipt;
    }
}