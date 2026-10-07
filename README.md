# HelperBook

Simple Staff Management for Small Businesses.

HelperBook is an online-only app for shops and small teams. Owners sign in with their mobile number and a one-time code. Employee, attendance, and salary tools are not included yet.

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

### Authentication

Owners sign in with an Indian mobile number and a 6-digit OTP. In development, set `OTP_PROVIDER=mock` in `server/.env`. The API prints the code in the server console as `[DEV OTP]`. That mock provider does not run in production.

Tokens are stored in the phone's secure storage. JWT secrets and OTP provider credentials stay on the server.

### Shop setup

After sign-in, HelperBook loads the owner's shop. A new owner completes shop setup: name, business type, owner details, address, working days, hours, and an optional logo. The next launch opens the dashboard when that shop already exists.

Shop APIs require a bearer access token. The server uses the token to decide the owner. Logo files are stored outside MongoDB. Development uses `IMAGE_PROVIDER=local`. Production must use `IMAGE_PROVIDER=cloudinary` with server-side Cloudinary credentials.

### Dashboard

The home screen loads `GET /api/dashboard`. The server counts active and inactive employees for the signed-in owner's shop and returns the five most recently added people. Present, absent, pending salary, and outstanding advance stay at zero until those records exist. The app does not invent those numbers, and it does not keep a dashboard copy on the phone.

### Employees

From Home or Employees, add helpers, edit their role, joining date, and salary, and mark them inactive when they leave. Permanent delete is only for an employee with no later attendance or payment records. The server attaches each employee to the signed-in owner's shop. Returning to Home loads the dashboard again.

### Design notes

Screens talk to the API through one Axios client. Business data is not stored on the device for later sync. If the server cannot be reached, the app shows a connection error.

Employee records stay on the server. The API only returns employees for the signed-in owner's active shop.
