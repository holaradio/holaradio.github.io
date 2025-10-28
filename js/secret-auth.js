// sha256Hex(str) -> Promise resolving to hex string. Uses Web Crypto when available,
// falls back to a small JS implementation for older/insecure contexts.

(function () {
  'use strict';

  // Compact SHA-256 implementation (synchronous). Returns hex string.
  // Public-domain minimal implementation adapted for browser fallback.
  function jsSha256(ascii) {
    function rightRotate(n, x) { return (x >>> n) | (x << (32 - n)); }
    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var lengthProperty = 'length';
    var i, j; // Used as a counter across the whole function
    var result = '';

    var words = [];
    var asciiBitLength = ascii[lengthProperty] * 8;

    // constants [first 32 bits of the fractional parts of the cube roots of the first 64 primes]
    var k = [
      1116352408, 1899447441, -1245643825, -373957723, 961987163, 1508970993,
      -1841331548, -1424204075, -670586216, 310598401, 607225278, 1426881987,
      1925078388, -2132889090, -1680079193, -1046744716, -459576895, -272742522,
      264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986,
      -1740746414, -1473132947, -1341970488, -1084653625, -958395405, -710438585,
      113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291,
      1695183700, 1986661051, -2117940946, -1838011259, -1564481375, -1474664885,
      -1035236496, -949202525, -778901479, -694614492, -200395387, 275423344,
      430227734, 506948616, 659060556, 883997877, 958139571, 1322822218,
      1537002063, 1747873779, 1955562222, 2024104815, -2067236844, -1933114872,
      -1866530822, -1538233109, -1090935817, -965641998
    ];

    var hash = [
      1779033703, -1150833019, 1013904242, -1521486534,
      1359893119, -1694144372, 528734635, 1541459225
    ];

    var i;
    var w = new Array(64);

    // Pre-processing
    var asciiArr = [];
    for (i = 0; i < ascii[lengthProperty]; i++) {
      asciiArr.push(ascii.charCodeAt(i));
    }
    // append '1' bit (0x80)
    asciiArr.push(0x80);
    // pad with zeros until length ≡ 448 mod 512 (i.e. last 64 bits for length)
    while ((asciiArr.length * 8) % 512 !== 448) asciiArr.push(0);

    // append length (64-bit big-endian)
    var lenHi = Math.floor(asciiBitLength / maxWord);
    var lenLo = asciiBitLength >>> 0;
    // push 8 bytes big-endian
    asciiArr.push((lenHi >>> 24) & 0xFF);
    asciiArr.push((lenHi >>> 16) & 0xFF);
    asciiArr.push((lenHi >>> 8) & 0xFF);
    asciiArr.push((lenHi) & 0xFF);
    asciiArr.push((lenLo >>> 24) & 0xFF);
    asciiArr.push((lenLo >>> 16) & 0xFF);
    asciiArr.push((lenLo >>> 8) & 0xFF);
    asciiArr.push((lenLo) & 0xFF);

    // Process the message in successive 512-bit chunks:
    for (j = 0; j < asciiArr.length; j += 64) {
      for (i = 0; i < 16; i++) {
        var idx = j + i * 4;
        w[i] = ((asciiArr[idx] << 24) | (asciiArr[idx + 1] << 16) | (asciiArr[idx + 2] << 8) | (asciiArr[idx + 3])) >>> 0;
      }
      for (i = 16; i < 64; i++) {
        var s0 = (rightRotate(7, w[i - 15]) ^ rightRotate(18, w[i - 15]) ^ (w[i - 15] >>> 3)) >>> 0;
        var s1 = (rightRotate(17, w[i - 2]) ^ rightRotate(19, w[i - 2]) ^ (w[i - 2] >>> 10)) >>> 0;
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }

      var a = hash[0], b = hash[1], c = hash[2], d = hash[3];
      var e = hash[4], f = hash[5], g = hash[6], h = hash[7];

      for (i = 0; i < 64; i++) {
        var S1 = (rightRotate(6, e) ^ rightRotate(11, e) ^ rightRotate(25, e)) >>> 0;
        var ch = ((e & f) ^ (~e & g)) >>> 0;
        var temp1 = (h + S1 + ch + k[i] + w[i]) >>> 0;
        var S0 = (rightRotate(2, a) ^ rightRotate(13, a) ^ rightRotate(22, a)) >>> 0;
        var maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
        var temp2 = (S0 + maj) >>> 0;

        h = g; g = f; f = e;
        e = (d + temp1) >>> 0;
        d = c; c = b; b = a;
        a = (temp1 + temp2) >>> 0;
      }

      hash[0] = (hash[0] + a) >>> 0;
      hash[1] = (hash[1] + b) >>> 0;
      hash[2] = (hash[2] + c) >>> 0;
      hash[3] = (hash[3] + d) >>> 0;
      hash[4] = (hash[4] + e) >>> 0;
      hash[5] = (hash[5] + f) >>> 0;
      hash[6] = (hash[6] + g) >>> 0;
      hash[7] = (hash[7] + h) >>> 0;
    }

    for (i = 0; i < hash.length; i++) {
      var hex = (hash[i] >>> 0).toString(16);
      result += ('00000000' + hex).slice(-8);
    }
    return result;
  }

  // Primary sha256Hex: tries Web Crypto first, otherwise falls back to jsSha256
  async function sha256Hex(str) {
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle && typeof window.crypto.subtle.digest === 'function') {
        const enc = new TextEncoder();
        const data = enc.encode(str);
        const hash = await window.crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) {
      // ignore and fallback
      console.warn('WebCrypto SHA-256 failed, using JS fallback', e);
    }
    // Fallback (synchronous) but we return a Promise to keep API consistent
    return Promise.resolve(jsSha256(str));
  }

  // simple XOR+base64 obfuscation for ascii hex strings
  function xorEncodeToBase64(ascii, key) {
    const out = [];
    for (let i = 0; i < ascii.length; i++) out.push(String.fromCharCode(ascii.charCodeAt(i) ^ key));
    return btoa(out.join(''));
  }
  function xorDecodeFromBase64(b64, key) {
    const s = atob(b64);
    let out = '';
    for (let i = 0; i < s.length; i++) out += String.fromCharCode(s.charCodeAt(i) ^ key);
    return out;
  }

  // export to window
  window.sha256Hex = sha256Hex;
  window.xorEncodeToBase64 = xorEncodeToBase64;
  window.xorDecodeFromBase64 = xorDecodeFromBase64;
})();