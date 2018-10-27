const EthCrypto = require('eth-crypto');
const db = require('../db');
const logs = require('../logs.js')(module);

/**
 * EthCrypto reference
 *
 * - Create private key
 * const identity = EthCrypto.createIdentity();
 * {
      address: '0x3f243FdacE01Cfd9719f7359c94BA11361f32471',
      privateKey: '0x107be9...',
      publicKey: 'bf1cc315...'
  }
 *
 * - From private key to public key
 * const publicKey = EthCrypto.publicKeyByPrivateKey('0x107be9...);
 * - Publick key to address
 * const address = EthCrypto.publicKey.toAddress('bf1cc315...);
 *
 * - Sign message
 * const message = 'foobar';
   const messageHash = EthCrypto.hash.keccak256(message);
   const signature = EthCrypto.sign(privateKey, messageHash);
 */

// dyndnsHost has to be stripped of http(s):// tag
// process.env.DYNDNS_DOMAIN should include said tag
function getDyndnsHost() {
    const {DYNDNS_DOMAIN} = process.env;
    return DYNDNS_DOMAIN && DYNDNS_DOMAIN.includes('://')
        ? DYNDNS_DOMAIN.split('://')[1]
        : DYNDNS_DOMAIN;
}


async function generateKeys() {
    const _keypair = await db.get('keypair');
    if (_keypair) {
        let _domain = (_keypair || {}).domain;
        logs.info(`Skipping keypair generation, found identity in db: ${_domain}`);
        return;
    }
    const identity = EthCrypto.createIdentity();
    const subdomain = identity.address.toLowerCase().substr(2).substring(0, 16);
    const domain = subdomain+'.'+getDyndnsHost();
    identity.domain = domain;
    await db.set('keypair', identity);
    await db.set('domain', domain);
}

module.exports = generateKeys;
