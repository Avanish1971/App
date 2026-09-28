# location_app – Backend (Express + MongoDB)

## Setup (5 steps)

1. Is `server` folder ko apne project ke andar (ya bagal mein, alag folder) rakho, aur terminal mein andar jaake:
   ```
   npm install
   ```

2. `.env.example` ko copy karke `.env` banao:
   ```
   cp .env.example .env
   ```
   Phir `.env` file kholo aur `MONGO_URI` mein apni Atlas connection string daalo
   (MongoDB Atlas dashboard → Connect → Drivers → copy string, usme <password> replace karo).

3. Purana seed data (Employees, Leaves, Attendance, etc.) MongoDB mein daalo (sirf ek baar):
   ```
   npm run seed
   ```

4. Server chalao:
   ```
   npm run dev
   ```
   (agar `nodemon` error de, toh `npm install -g nodemon` karo, ya `npm start` use karo)

   Server `http://localhost:5000` par chalega.

5. Test karo — browser mein kholo: `http://localhost:5000/api/employees`
   Agar aapko JSON mein 10 employees dikhein, matlab sab sahi chal raha hai.

## Available API Routes

| Method | Route                              | Kaam                                   |
|--------|-------------------------------------|------------------------------------------|
| GET    | /api/employees                      | Sab employees                             |
| POST   | /api/employees                      | Naya employee add karo                    |
| PUT    | /api/employees/:id/status            | Active/Inactive karo                      |
| GET    | /api/offices                        | Sab offices                               |
| PUT    | /api/offices/:id/radius              | Geofence radius update                    |
| GET    | /api/shifts                         | Sab shifts                                |
| GET    | /api/attendance?date=YYYY-MM-DD      | Ek din ke sab records                     |
| GET    | /api/attendance/:employeeId          | Ek employee ki poori history              |
| PUT    | /api/attendance/:employeeId/today    | Aaj ka record update/check-in             |
| GET    | /api/leaves                         | Sab leave requests                        |
| POST   | /api/leaves                         | Naya leave apply                          |
| PUT    | /api/leaves/:id                     | Approve/Reject (body: {status})           |
| GET    | /api/regularizations                | Sab regularization requests               |
| POST   | /api/regularizations                | Naya regularization apply                 |
| PUT    | /api/regularizations/:id             | Approve/Reject                            |
| GET    | /api/expenses                       | Sab expense claims                        |
| POST   | /api/expenses                       | Naya expense submit                       |
| PUT    | /api/expenses/:id                   | Approve/Reject                            |
| GET    | /api/audit-logs                     | Audit trail                               |
| GET    | /api/policy                         | Attendance policy                         |
| PUT    | /api/policy                         | Policy save                               |

## Deploy karte waqt
- Isko Render.com (free tier) ya Railway pe host karo, alag se React app se.
- `.env` file kabhi GitHub pe push mat karo — `.gitignore` mein daalo.
- Production mein `CLIENT_ORIGIN` ko apne deployed React app ke URL pe set karo.
