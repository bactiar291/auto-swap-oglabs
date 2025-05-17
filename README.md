# 🌀 Auto Swap OGLabs

Bot otomatis untuk melakukan **swap acak** antara token (ETH, USDT, BTC) di jaringan OGLabs secara berkala dan random. Cocok untuk interaksi farming, testing aktivitas wallet, atau keperluan off-chain strategi lainnya.

## 🌐 Jaringan yang Digunakan

- **Chain**: OGLabs Galileo Testnet
- **Explorer**: [https://chainscan-galileo.0g.ai](https://chainscan-galileo.0g.ai)

---

## 🚀 Fitur

- 🔁 Swap acak antar token (ETH, USDT, BTC)
- 🛡️ Menyisakan saldo minimum agar wallet tetap hidup
- ⏱️ Delay random antar swap (30–90 detik)
- 🔍 Transaksi langsung terlihat di explorer OGLabs
- ✅ Auto Approve jika allowance belum cukup
- 💻 CLI interaktif dengan warna dan status transaksi

---

```bash
git clone https://github.com/bactiar291/auto-swap-oglabs.git
cd auto-swap-oglabs
```
Install Dependencies :
```bash
npm install
```
"YOUR_PRIVATE_KEY" in pk.txt tepat dibawahnya rpc 
Usage 🖥️
```bash
node swap.js
```
