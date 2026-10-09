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

The home screen loads `GET /api/dashboard`. The server counts active and inactive employees for the signed-in owner's shop and returns the five most recently added people. Present, absent, half day, leave, and not marked come from today's attendance records. Salary Pending is the total of finalized salaries that have not been paid. It is ₹0 with “All finalized salaries paid” when every finalized salary is paid, and “No finalized salary yet” when none exist. Outstanding advance stays at zero until advance records exist. Recent salary payments come from recorded payments. The app does not keep a dashboard copy on the phone.

### Attendance

From Attendance, mark each helper Present, Absent, Half Day, or Leave for a shop date, or mark several people at once. The monthly calendar and history use the same records. A weekly off is shown as closed and is not filled in automatically.

### Salary

Salary is calculated on the server for a calendar month. Monthly pay starts from the saved monthly amount and can deduct unpaid absence, half days, and unpaid leave. Daily pay is the daily rate times payable days. Bonus and other deductions can be added before the month is finalized. A finalized salary does not change when attendance changes until it is reopened.

Paying a salary is separate from calculating it. Finalizing a salary leaves it unpaid. The owner then records cash, UPI, or bank transfer for the exact final amount. HelperBook does not send the money. A mistaken payment can be reversed, which keeps the payment in history and returns the salary to unpaid. A paid salary cannot be reopened until that payment is reversed. Payment does not change the advance balance or recalculate leave.

A paid salary can be opened as a receipt. The receipt shows the shop, employee, period, attendance, breakdown, and payment already stored for that salary. The owner can generate a PDF and share it through the phone's share sheet, including WhatsApp when it is installed. Generating a receipt does not change the salary or the payment.

### Leave

The shop owner can request leave, record leave that is already approved, and approve, reject, or cancel it. Approved leave is what attendance shows when a day has not been marked, and it is what salary uses. Pending, rejected, and cancelled leave do not change pay. A finalized salary stays as it is until it is reopened.

### Advance / Khata

An employee advance is a ledger of money given, cash repaid, and amounts deducted from salary. The outstanding balance is calculated from those entries. A salary preview does not reduce the balance until the salary is finalized.

### Employees

From Home or Employees, add helpers, edit their role, joining date, and salary, and mark them inactive when they leave. Permanent delete is only for an employee with no later attendance or payment records. The server attaches each employee to the signed-in owner's shop. Returning to Home loads the dashboard again.

### Design notes

Screens talk to the API through one Axios client. Business data is not stored on the device for later sync. If the server cannot be reached, the app shows a connection error.

Employee records stay on the server. The API only returns employees for the signed-in owner's active shop.
