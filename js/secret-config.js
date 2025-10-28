// NOTE: replace the placeholder obf strings with actual obfuscated base64 values
window.SECRET_CONFIG = {
  // obfuscation key (0-255)
  obfKey: 77,

  // obfuscated trigger hash (already used by secret-init.js)
  triggerHashObf: "K3l8Li4oeHV/f3R/dXR1fy8of3R0K3krLC5/fHx0dHt0f310LHl5KHl/fXx8KywufysvK3opKCh9KC8ofnh1fA==",

  // users: store obfuscated SHA-256 hex strings for username (lowercased) and password
  users: [
    {
      usernameHashObf: "Ky54dCx7KH1+fil8KXQoKXovLy8pLy57eX95KX97fnl0e3l9Lnl8Ln56KCt+K3wvdX8peyx7fH58K3x1eykuKA==",
      passwordHashObf: "fy8vdXsueywofCsrLyh0Ly8re3x7L31+dSt1Li55KXgpenl9fHl4Ln0oKHV5eXwvKC51fXgrKX94eix8K358Lw==",
      redirect: "intra/"
    }
    // add more entries if needed
  ]
};