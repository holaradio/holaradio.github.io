// NOTE: replace the placeholder obf strings with actual obfuscated base64 values
window.SECRET_CONFIG = {
  // obfuscation key (0-255)
  obfKey: 77,

  // obfuscated trigger hash (already used by secret-init.js)
  triggerHashObf: "fn58fSwrLnl5L3l/KC55dCl+KX18eisoK3koKXp5Ln57eH58eXwsei8udHp+f3R/f3R0fnV8eHR6KH18eHx6eA==",

  // users: store obfuscated SHA-256 hex strings for username (lowercased) and password
  users: [
    {
      usernameHashObf: "dXV+ey99KCgoeSl+fCh6eX0rdHssLH8ofSt4fXl8ensvLC56eHR+LHx6Lnt9fS58KHl/L3R/Lnh9eCsoKX98eA==",
      passwordHashObf: "eCx+dXh5e3sre316eHR7Lyguey94K398eix9Ly98fit7eiwrL3V7dXQre3p9KS9/K3UpL3t8dHssKXR+e3l/Lw==",
      redirect: "intra/"
    }
    // add more entries if needed
  ]
};