const CryptoJS = require('crypto-js');

// In a real app, the server seed is hidden on the server until rotated.
// Here we simulate it by keeping it in memory but not exposing it directly in the outcome until necessary (or hashed).
let activeServerSeed = generateServerSeed();

function generateServerSeed() {
    return CryptoJS.lib.WordArray.random(32).toString();
}

function generateClientSeed() {
    return CryptoJS.lib.WordArray.random(16).toString();
}

function hashSeed(seed) {
    return CryptoJS.SHA256(seed).toString();
}

/**
 * Generates a result using HMAC-SHA256(serverSeed, clientSeed: nonce)
 * This is the standard Provably Fair algorithm.
  */
const generateOutcome = async (
    items,
    clientSeed,
    nonce
) => {

    // 1. Calculate HMAC
    const message = `${clientSeed}:${nonce}`;
    const hmac = CryptoJS.HmacSHA256(message, activeServerSeed).toString();

    // 2. Take first 8 characters (32 bits) to generate a number
    const subHash = hmac.substring(0, 8);
    const decimal = parseInt(subHash, 16);
    const randomValue = decimal / Math.pow(2, 32); // 0.0 to 1.0

    // 3. Select Item based on weights
    const totalOdds = items.reduce((acc, item) => acc + item.odds, 0);
    let cumulativeProbability = 0;
    let selectedItem = items[items.length - 1];

    for (const item of items) {
        const probability = item.odds / totalOdds;
        cumulativeProbability += probability;

        if (randomValue <= cumulativeProbability) {
            selectedItem = item;
            break;
        }
    }

    const result = {
        item: selectedItem,
        serverSeed: activeServerSeed,
        serverSeedHash: hashSeed(activeServerSeed),
        nonce,
        randomValue,
        block: {
            height: 840000 + Math.floor(Math.random() * 1000),
            hash: "0000000000000000000" + CryptoJS.lib.WordArray.random(20).toString()
        }
    };

    return result;
};

/**
 * Verify a box opening outcome using provably fair parameters
 */
const verifyOutcome = (
    serverSeed,
    clientSeed,
    nonce
) => {
    const message = `${clientSeed}:${nonce}`;
    const hmac = CryptoJS.HmacSHA256(message, serverSeed).toString();
    const subHash = hmac.substring(0, 8);
    const decimal = parseInt(subHash, 16);
    return decimal / Math.pow(2, 32);
};

/**
 * Verify that a server seed matches a server seed hash
 */
const verifyServerSeedHash = (
    serverSeed,
    serverSeedHash
) => {
    const calculatedHash = CryptoJS.SHA256(serverSeed).toString();
    return calculatedHash.toLowerCase() === serverSeedHash.toLowerCase();
};

const rotateServerSeed = () => {
    activeServerSeed = generateServerSeed();
    return hashSeed(activeServerSeed);
};

const getServerSeedHash = () => {
    return hashSeed(activeServerSeed);
}

module.exports = {
    generateServerSeed,
    generateClientSeed,
    hashSeed,
    generateOutcome,
    verifyOutcome,
    verifyServerSeedHash,
    rotateServerSeed,
    getServerSeedHash
};
