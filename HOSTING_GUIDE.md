# 🌐 Hướng Dẫn Deploy & Host Buckshot Roulette Miễn Phí 100%

Tài liệu này hướng dẫn bạn cách đưa game **Buckshot Roulette Multiplayer** lên Internet để chơi với bạn bè mọi lúc mọi nơi hoàn toàn **MIỄN PHÍ**!

---

## 🛠️ Tổng Quan Kiến Trúc Deploy

1. **Backend (Socket.io Realtime Server)**: Host trên **Render.com** (Free Tier Web Service).
2. **Frontend (Vite React Web App)**: Host trên **Vercel** hoặc **Netlify** (Free 1-Click Hosting).

---

## 🚀 BƯỚC 1: Deploy Backend Server lên Render.com (Miễn phí)

1. Đăng ký/Đăng nhập tài khoản [Render.com](https://render.com) (Đăng nhập bằng GitHub).
2. Đẩy dự án của bạn lên **GitHub repository**.
3. Tại trang điều khiển Render, nhấn **New +** -> Chọn **Web Service**.
4. Kết nối đến GitHub repository của bạn.
5. Cấu hình thông số Web Service như sau:
   - **Name**: `buckshot-roulette-server` (hoặc tùy chọn)
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Nhấn **Create Web Service**.
7. Sau vài phút, Render sẽ cấp cho bạn một đường dẫn URL Server, ví dụ:
   `https://buckshot-roulette-server.onrender.com`

---

## 💻 BƯỚC 2: Deploy Frontend Client lên Vercel (Miễn phí)

1. Đăng ký/Đăng nhập tài khoản [Vercel.com](https://vercel.com) bằng GitHub.
2. Nhấn **Add New...** -> **Project** -> Chọn repository Buckshot Roulette từ GitHub.
3. Cấu hình Project trên Vercel:
   - **Root Directory**: chọn thư mục `client` (Nhấn Edit -> Chọn folder `client`).
   - **Framework Preset**: Vite (Vercel tự động nhận diện).
   - **Environment Variables** (Biến môi trường):
     - Key: `VITE_SERVER_URL`
     - Value: URL Backend từ Bước 1 (Ví dụ: `https://buckshot-roulette-server.onrender.com`)
4. Nhấn **Deploy**.
5. Vercel sẽ cấp cho bạn đường dẫn chơi game miễn phí dạng:
   `https://buckshot-roulette.vercel.app`

---

## 🎮 BƯỚC 3: Thưởng Thức Game Cùng Bạn Bè!

1. Truy cập vào link Vercel vừa tạo.
2. Nhập tên của bạn và bấm **TẠO PHÒNG MỚI**.
3. Nhấn **SAO CHÉP LINK MỜI BẠN BÈ** (hoặc gửi Mã Phòng) cho bạn bè.
4. Bạn bè mở link -> Nhập tên -> Tự động tham gia phòng đấu súng!

---

## ⚡ Hướng Dẫn Chạy Local (Chơi Thử Ở Máy Cá Nhân)

1. Mở Terminal tại thư mục `server/`:
   ```bash
   cd server
   npm install
   npm run dev
   ```
2. Mở Terminal mới tại thư mục `client/`:
   ```bash
   cd client
   npm install
   npm run dev
   ```
3. Mở 2 tab trình duyệt tại `http://localhost:5173` để chơi thử 2 người trên cùng máy!
