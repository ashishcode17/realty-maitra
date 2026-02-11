# Test the app on your phone (iPhone / Android)

The app is set up for mobile: responsive layout and viewport. To try it on your iPhone from your PC:

---

## 1. Start the app so it’s reachable on your network

From the **realty-collective** folder:

```bash
npm run dev
```

The dev server now runs with **`-H 0.0.0.0`**, so it listens on all network interfaces, not only `localhost`. Your phone can connect using your PC’s IP address.

---

## 2. Find your PC’s IP address (Windows)

1. Press **Win + R**, type **`cmd`**, Enter.
2. Run: **`ipconfig`**
3. Find **Wireless LAN adapter Wi-Fi** (or **Ethernet** if you’re on cable).
4. Note the **IPv4 Address**, e.g. **192.168.1.105**.

---

## 3. Open the app on your iPhone

1. Connect your **iPhone to the same Wi‑Fi** as your PC.
2. Open **Safari** (or Chrome) on the iPhone.
3. In the address bar type: **`http://YOUR_PC_IP:3000`**  
   Example: **`http://192.168.1.105:3000`**
4. Go to that URL. You should see the app (home or login).

---

## 4. If the page doesn’t load

**Windows Firewall** may be blocking port 3000:

1. Open **Windows Defender Firewall** → **Advanced settings**.
2. **Inbound Rules** → **New Rule** → **Port** → **TCP**, port **3000**.
3. Allow the connection for **Private** (and **Domain** if you use it).
4. Name it e.g. “Next.js dev” and finish.

Then try **`http://YOUR_PC_IP:3000`** again on your iPhone.

---

## Quick checklist

- [ ] Docker is running (for the database).
- [ ] `npm run dev` is running in **realty-collective**.
- [ ] iPhone is on the **same Wi‑Fi** as the PC.
- [ ] You’re using **http://PC_IP:3000** (replace PC_IP with the IPv4 from `ipconfig`).
- [ ] If it still doesn’t load, add a firewall rule for TCP port 3000.

You can log in and use the app on your iPhone the same way as on your PC.
