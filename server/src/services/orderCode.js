const crypto = require('crypto');

// Short, human-typeable public order code (e.g. HB-7K3QF9). Avoids
// exposing internal sequential DB ids to customers doing a status lookup.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

function generateOrderCode() {
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i += 1) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `HB-${code}`;
}

module.exports = { generateOrderCode };
