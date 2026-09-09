# OISM — Omnichannel Inventory and Sales Management System

Hệ thống quản lý bán hàng và tồn kho đa kênh — bản viết lại bằng **Node.js** (thay cho bản
tham khảo .NET 8/Clean Architecture ban đầu), giữ đầy đủ và mở rộng các nghiệp vụ theo đề bài
3.1: append-only inventory ledger, giá vốn bình quân gia quyền, chống bán vượt tồn kho
(anti-oversell) dưới tải đồng thời cao, order hub đa kênh, POS nhanh, real-time, background jobs,
multi-tenant SaaS.

## Kiến trúc & công nghệ

| Thành phần | Công nghệ |
|---|---|
| Backend API | Node.js 20, TypeScript, Express |
| ORM / Database | Prisma + **PostgreSQL** (row-level lock `SELECT ... FOR UPDATE` cho anti-oversell) |
| Xác thực | JWT (access + refresh token xoay vòng), bcrypt |
| Real-time | Socket.IO (thay cho SignalR) — phòng theo TenantId |
| Background jobs | node-cron (thay cho Hangfire) — tự huỷ đơn Reserved hết hạn, quét cảnh báo tồn kho |
| Test | Jest + Prisma (test tích hợp chạy trên Postgres thật) |
| Frontend | React 18 + Vite + Ant Design 5 + Zustand + socket.io-client |
| Hạ tầng | Docker, docker-compose, GitHub Actions CI |

Backend tổ chức theo tinh thần Clean Architecture (NFR-MAINT-01), rút gọn cho phù hợp quy mô Node/Express:

```
backend/src/
  domain/         # logic thuần, không phụ thuộc DB: state machine đơn hàng, COGS, barcode, lỗi nghiệp vụ
  modules/<name>/ # mỗi domain nghiệp vụ: schema (zod) + service (Prisma) + controller + routes
  middlewares/    # auth (JWT), RBAC, validate, error handler
  realtime/       # Socket.IO
  jobs/           # node-cron
```

## So với bản .NET tham khảo — các điểm đã cải tiến

Bản .NET đính kèm là một MVP tốt cho lõi nghiệp vụ (ledger, reservation, order state machine) nhưng
còn thiếu nhiều phần so với đề bài. Bản Node.js này giữ nguyên các cơ chế lõi đã đúng và bổ sung:

- **Tồn kho theo từng chi nhánh thật sự** (`StockItem` theo `productId + branchId`) thay vì tồn kho
  toàn hệ thống — đúng với FR-RSE-01 ("available stock **per SKU at each branch**").
- **Multi-tenant có thật**: `Tenant`, `User`, đăng ký cửa hàng (FR-AUTH-01), refresh token, RBAC theo
  3 vai trò Owner/Staff/Cashier — bản .NET dùng tài khoản demo hard-code.
- **Purchase Receipt, Stock Transfer (2 bước xuất/nhận), Stocktake** được hiện thực đầy đủ vòng đời
  (bản .NET mới có entity nền, chưa có service).
- **Barcode EAN-13 tự sinh có checksum hợp lệ**, SKU tự sinh (FR-PROD-03).
- **Webhook simulator** có nhật ký (`WebhookLog`) và một công cụ **bắn N đơn đồng thời** vào cùng
  một SKU để trực quan hoá cơ chế khoá dòng chống oversell (NFR-PERF-02) — dùng để demo/kiểm thử.
- **Báo cáo** đủ 3 loại theo FR-REP (doanh thu & lợi nhuận có filter, tồn kho & vòng quay, cảnh báo
  tồn kho theo ngưỡng từng SKU) thay vì báo cáo tổng đơn giản.
- Toàn bộ transaction Reserve → Confirm cho luồng Order Hub **chạy trong cùng 1 transaction DB**
  với thao tác tồn kho (NFR-SEC-02), thay vì gọi tách rời như bản .NET.

## Bắt đầu nhanh bằng Docker

```bash
docker compose up -d db
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npm run seed
npm run dev
```

```bash
cd oism-frontend
cp .env.example .env
npm install
npm run dev
```

Mở `http://localhost:5173`, đăng nhập bằng tài khoản demo (được tạo bởi `npm run seed`):

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Owner (toàn quyền) | owner@demo.com | 123456 |
| Staff (kho/đơn hàng) | staff@demo.com | 123456 |
| Cashier (chỉ POS) | cashier@demo.com | 123456 |

> **Lưu ý cổng 5432**: nếu máy bạn đã có PostgreSQL cài sẵn (native service) chiếm cổng 5432, đổi
> cổng map trong `docker-compose.yml` (vd `5433:5432`) và cập nhật `DATABASE_URL` trong `.env` tương ứng.

Hoặc chạy toàn bộ (db + backend + frontend) bằng một lệnh:

```bash
docker compose up -d --build
```

## Kiểm thử

Test tích hợp chạy trên Postgres thật nên dùng **database riêng**, tách khỏi database `npm run dev`
đang dùng (tránh test tự động xoá/ghi đè dữ liệu demo bạn đang thao tác trên UI):

```bash
docker exec -it <container_postgres> psql -U oism -d postgres -c "CREATE DATABASE oism_test;"
cd backend
cp .env.test.example .env.test
npx dotenv -e .env.test -- npx prisma migrate deploy   # hoặc set DATABASE_URL rồi chạy migrate deploy
npm test
```

Bộ test gồm:
- Unit test thuần (không cần DB): COGS bình quân gia quyền, state machine đơn hàng, checksum EAN-13.
- Integration test chạy trên Postgres thật: reserve/release/confirm tồn kho, vòng đời đơn hàng,
  idempotency webhook, và **một test bắn 50 request đặt chỗ đồng thời vào 1 SKU chỉ có 20 tồn kho —
  khẳng định số lượng giữ chỗ thành công luôn đúng bằng 20, không bao giờ âm** (bằng chứng cho
  NFR-PERF-02).

### Phát hiện khi kiểm thử tải thật (đáng chú ý)

Khi bắn 100+ request đồng thời vào cùng 1 SKU trên máy đang bận CPU (vd: chạy song song trình duyệt
tự động để chụp ảnh minh hoạ), một số request lỗi `"Unable to start a transaction in the given
time"` — **không phải lỗi logic chống oversell** (available không bao giờ âm, ledger không bao giờ
sai), mà do cấu hình mặc định của Prisma cho transaction tương tác (`maxWait: 2s`, `timeout: 5s`)
quá ngắn khi hàng loạt transaction cùng xếp hàng chờ khoá 1 dòng (`SELECT ... FOR UPDATE`). Đã sửa
tại `stock.service.ts` bằng cách nâng `maxWait`/`timeout` lên 20s và coi lỗi này là transient (có
retry), đồng thời nâng `connection_limit`/`pool_timeout` của Postgres pool trong `DATABASE_URL`.
Sau khi sửa: bắn đúng kịch bản nêu trong đề bài (50 đơn đồng thời tranh nhau 1 SKU còn 1 hàng) cho
kết quả sạch tuyệt đối — 1 thành công, 49 bị từ chối, 0 lỗi hạ tầng — kể cả khi máy đang chịu tải
CPU nặng từ tiến trình khác.

## Traceability — chức năng đề bài ↔ nơi hiện thực

| Mã yêu cầu | Hiện thực |
|---|---|
| FR-AUTH-01..04 | `backend/src/modules/auth`, `users`, `branches` |
| FR-PROD-01..04 | `backend/src/modules/catalog` |
| FR-INV-01..04 | `backend/src/modules/inventory` (`stock.service.ts` là lõi chống oversell + ledger) |
| FR-COST-01/02 | `backend/src/domain/cogs.ts`, áp dụng trong `purchaseReceipts.service.ts` và `orders.service.ts` |
| FR-ORD-01..03 | `backend/src/modules/orders` |
| FR-RSE-01..03 | `backend/src/modules/inventory/stock.service.ts` (`reserveStock/confirmStock/releaseStock`) |
| FR-POS-01..04 | `backend/src/modules/pos`, `oism-frontend/src/pages/pos` |
| FR-REP-01..03 | `backend/src/modules/reports` |
| FR-SIM-01..03 | `backend/src/modules/webhooks`, `backend/src/realtime`, `backend/src/jobs` |
| NFR-TENANT-01/02 | mọi bảng nghiệp vụ có `tenantId`, mọi query lọc theo `tenantId`; index composite `(tenantId, createdAt)`, `(tenantId, productId)` trên ledger/orders |
| NFR-SEC-01..03 | bcrypt + JWT ngắn hạn, transaction ACID cho Reserve→Confirm, ledger append-only (không có endpoint update/delete) |

## Cấu trúc thư mục

```
backend/            # Node.js API (Express + Prisma + PostgreSQL)
oism-frontend/       # React SPA (Vite + Ant Design)
docker-compose.yml   # Postgres + backend + frontend
.github/workflows/   # CI: build + test backend, build frontend
```
