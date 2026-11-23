// License key generation.
//
// Format XXXX-XXXX-XXXX-XXXX. The injected panel accepts a 19-character key
// client-side; anything shorter is rejected before the request is even built.
// Crockford-style alphabet (no I, L, O, U) so a key read off a screenshot or
// typed by a customer cannot be misheard into a different valid key.

import crypto from 'crypto';

const KEY_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function generateLicenseKey(): string {
  const groups: string[] = [];
  for (let g = 0; g < 4; g++) {
    let chunk = '';
    for (let i = 0; i < 4; i++) {
      // randomInt is uniform; Math.random would bias the first characters.
      chunk += KEY_ALPHABET[crypto.randomInt(0, KEY_ALPHABET.length)];
    }
    groups.push(chunk);
  }
  return groups.join('-');
}
