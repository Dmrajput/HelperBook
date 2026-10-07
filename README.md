# HelperBook

Simple Staff Management for Small Businesses.

HelperBook is an online-only app for shops and small teams. This phase sets up the Expo app, the Express API, and the folders later modules will use. Sign-in, employees, attendance, salary, and payments are not included yet.

### Technology

```text
React Native
Expo
JavaScript
Node.js
Express
MongoDB
Mongoose
```

### Project Structure

```text
helperbook/
├── mobile/
└── server/
```

### Mobile Setup

```bash
cd mobile
npm install
npx expo start
```

Copy `mobile/.env.example` to `mobile/.env` first. Set the API URL to this computer's LAN address:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api
```

Do not use `http://localhost:5000` when testing on a physical Android device. On the phone, `localhost` means the phone itself.

Find the IPv4 address with `ipconfig` on Windows, or `ipconfig getifaddr en0` / `hostname -I` on macOS and Linux. The phone and the computer need to be on the same Wi-Fi network.

### Server Setup

```bash
cd server
npm install
npm run dev
```

Copy `server/.env.example` to `server/.env` before starting. The API listens on `0.0.0.0:5000` so a phone on the same network can reach it. Allow port 5000 through the computer firewall if the phone cannot connect.

From the repository root you can also run:

```bash
npm run server
npm run mobile
```

### MongoDB

Local:

```text
mongodb://localhost:27017/helperbook
```

MongoDB Atlas:

```text
MONGODB_URI=your_mongodb_atlas_connection_string
```

The database name must be `helperbook`. Put the connection string in `server/.env` only. Do not hardcode credentials.

### API Health Check

```text
GET /api/health
```

```json
{
  "success": true,
  "message": "HelperBook API is running",
  "environment": "development"
}
```

### Design notes

Screens talk to the API through one Axios client. Business data is not stored on the device for later sync. If the server cannot be reached, the app shows a connection error.

Later shop-owned records will include `shopId`. The API will enforce that a shop can only read its own data.
