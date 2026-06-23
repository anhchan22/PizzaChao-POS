# BACKEND API ENDPOINTS — PizzaChaoNgon POS

**Base URL:** `/api/v1`

---

## 📋 Mục lục

1. [Auth API](#auth-api)
2. [User API](#user-api)
3. [Product Category API](#product-category-api)
4. [Size API](#size-api)
5. [Product API](#product-api)
6. [Product Variant API](#product-variant-api)
7. [Product Option API](#product-option-api)
8. [Shift API](#shift-api)
9. [Order API](#order-api)
10. [Order Queue API](#order-queue-api)
11. [Payment API](#payment-api)
12. [Payment QR API](#payment-qr-api)
13. [Refund API](#refund-api)
14. [Expense API](#expense-api)
15. [Inventory API](#inventory-api)
16. [Stock Movement API](#stock-movement-api)
17. [Report API](#report-api)
18. [Activity Log API](#activity-log-api)
19. [Settings API](#settings-api)
20. [File Upload API](#file-upload-api)
21. [MVP Priority](#mvp-priority)
22. [Design Notes](#design-notes)

---

## Auth API

### POST /auth/login
**Đăng nhập**

Roles: `OWNER`, `STAFF`

### POST /auth/logout
**Đăng xuất**

### GET /auth/me
**Lấy thông tin user hiện tại**

### POST /auth/change-password
**Đổi mật khẩu**

---

## User API

Dành cho `OWNER` - Quản lý tài khoản nhân viên

### GET /users
**Lấy danh sách nhân viên**

Query: `?role=STAFF&status=ACTIVE&keyword=linh`

### POST /users
**Tạo tài khoản nhân viên**

### GET /users/{id}
**Xem chi tiết nhân viên**

### PUT /users/{id}
**Cập nhật thông tin nhân viên**

### PATCH /users/{id}/status
**Khóa/mở tài khoản nhân viên**

Body:
```json
{ "status": "INACTIVE" }
```

### POST /users/{id}/reset-password
**Đặt lại mật khẩu nhân viên**

---

## Product Category API

Quản lý danh mục món

### GET /product-categories
**Lấy danh sách danh mục**

### POST /product-categories
**Tạo danh mục**

### GET /product-categories/{id}
**Xem chi tiết danh mục**

### PUT /product-categories/{id}
**Cập nhật danh mục**

### DELETE /product-categories/{id}
**Xóa mềm danh mục**

### PATCH /product-categories/{id}/status
**Bật/tắt danh mục**

---

## Size API

Quản lý size/phần ăn

### GET /sizes
**Lấy danh sách size** (Nhỏ, Vừa, Lớn)

### POST /sizes
**Tạo size mới**

### PUT /sizes/{id}
**Cập nhật size**

### DELETE /sizes/{id}
**Xóa mềm size**

### PATCH /sizes/{id}/status
**Bật/tắt size**

---

## Product API

Quản lý món bán

### GET /products
**Lấy danh sách món**

Query: `?categoryId=1&status=ACTIVE&keyword=cháo`

### GET /products/pos
**Lấy danh sách món để hiển thị POS**

Điều kiện: `products.status = ACTIVE` & `product_variants.status = ACTIVE`

### POST /products
**Tạo món mới**

### GET /products/{id}
**Xem chi tiết món**

### PUT /products/{id}
**Cập nhật món**

### PATCH /products/{id}/status
**Cập nhật trạng thái món**

Body:
```json
{ "status": "SOLD_OUT" }
```

Status: `ACTIVE` | `SOLD_OUT` | `INACTIVE`

### DELETE /products/{id}
**Xóa mềm món**

---

## Product Variant API

Quản lý giá theo size của từng món

### GET /products/{productId}/variants
**Lấy danh sách size/giá của một món**

### POST /products/{productId}/variants
**Thêm size/giá cho món**

Body:
```json
{ "sizeId": 1, "price": 18000 }
```

### GET /product-variants/{id}
**Xem chi tiết variant**

### PUT /product-variants/{id}
**Cập nhật giá hoặc size**

### PATCH /product-variants/{id}/status
**Bật/tắt variant**

### DELETE /product-variants/{id}
**Xóa mềm variant**

---

## Product Option API

Quản lý topping/tùy chọn (có thể làm sau)

### GET /product-options
**Lấy danh sách option**

### POST /product-options
**Tạo option**

Body:
```json
{ "name": "Thêm thịt", "priceDelta": 5000 }
```

### PUT /product-options/{id}
**Cập nhật option**

### PATCH /product-options/{id}/status
**Bật/tắt option**

### DELETE /product-options/{id}
**Xóa mềm option**

---

## Shift API

Quản lý mở ca / đóng ca

### POST /shifts/open
**Mở ca bán**

Body:
```json
{ "openingCash": 500000, "openingNote": "Ca sáng" }
```

Rules:
- Nhân viên phải mở ca trước khi bán
- Một nhân viên không được có 2 ca OPEN cùng lúc

### GET /shifts/current
**Lấy ca đang mở của user hiện tại**

### GET /shifts
**OWNER xem danh sách ca**

Query: `?fromDate=2026-06-01&toDate=2026-06-22&userId=2&status=CLOSED`

### GET /shifts/{id}
**Xem chi tiết ca**

### GET /shifts/{id}/summary
**Lấy tổng kết ca**

Response: `totalOrders`, `cancelledOrders`, `totalRevenue`, `cashRevenue`, `bankRevenue`, `totalExpense`, `totalRefund`, `openingCash`, `expectedCash`, `actualCash`, `cashDifference`

### POST /shifts/{id}/close
**Đóng ca**

Body:
```json
{ "actualCash": 1860000, "closingNote": "Thiếu 20k do trả nhầm tiền thừa" }
```

Rules:
- Nếu `actualCash` lệch `expectedCash` → bắt buộc nhập `closingNote`
- Sau khi đóng ca không được tạo thêm đơn

### PATCH /shifts/{id}/owner-confirm
**Chủ xác nhận ca bán**

Body:
```json
{ "ownerConfirmed": true, "note": "Đã kiểm tra" }
```

---

## Order API

Quản lý đơn hàng

### POST /orders
**Tạo đơn mới**

Body:
```json
{
  "items": [
    { "productVariantId": 1, "quantity": 2, "optionIds": [1, 2], "note": "Không hành" }
  ],
  "discountAmount": 0,
  "note": "Khách chờ lấy ngay"
}
```

Rules:
- Phải có ca đang mở mới được tạo đơn
- Đơn mới tạo: `orderStatus = PENDING`, `paymentStatus = UNPAID`

### GET /orders
**Lấy danh sách đơn**

Query: `?fromDate=2026-06-01&toDate=2026-06-22&shiftId=1&cashierId=2&orderStatus=COMPLETED&paymentStatus=PAID`

### GET /orders/{id}
**Xem chi tiết đơn**

### PUT /orders/{id}
**Sửa đơn**

Rules: Chỉ sửa khi chưa COMPLETED, CANCELLED, REFUNDED

### POST /orders/{id}/items
**Thêm món vào đơn**

### PUT /orders/{id}/items/{itemId}
**Sửa số lượng/ghi chú món**

### DELETE /orders/{id}/items/{itemId}
**Xóa món khỏi đơn**

### PATCH /orders/{id}/status
**Cập nhật trạng thái đơn**

Body:
```json
{ "orderStatus": "PROCESSING" }
```

Status: `PENDING` | `PROCESSING` | `COMPLETED` | `CANCELLED` | `REFUNDED`

### PATCH /orders/{id}/complete
**Đánh dấu đơn đã hoàn thành**

### POST /orders/{id}/cancel
**Hủy đơn**

Body:
```json
{ "reason": "Khách đổi ý" }
```

Rules:
- Hủy đơn phải có lý do
- Nếu đơn đã thanh toán → xử lý hoàn tiền

---

## Order Queue API

Màn quản lý đơn chờ (dùng bảng `orders`)

### GET /orders/queue/current-shift
**Lấy danh sách đơn chờ trong ca hiện tại**

Query: `?status=PENDING`

Filter: `PENDING` | `PROCESSING` | `COMPLETED` | `CANCELLED`

### GET /orders/queue
**Lấy queue theo ca cụ thể**

Query: `?shiftId=1&status=PENDING`

### PATCH /orders/{id}/queue-status
**Cập nhật nhanh trạng thái đơn chờ**

Body:
```json
{ "status": "PROCESSING" }
```

### PATCH /orders/{id}/queue-complete
**Đánh dấu đơn trong queue đã xong**

---

## Payment API

Thanh toán đơn hàng

### POST /orders/{orderId}/payments
**Thanh toán đơn**

Body - Tiền mặt:
```json
{ "method": "CASH", "amount": 50000, "receivedAmount": 100000, "note": "Khách đưa 100k" }
```

Body - Chuyển khoản:
```json
{ "method": "BANK_TRANSFER", "amount": 50000, "transactionCode": "PCN1023", "note": "Đã kiểm tra app ngân hàng" }
```

Body - Kết hợp:
```json
{
  "payments": [
    { "method": "CASH", "amount": 20000, "receivedAmount": 20000 },
    { "method": "BANK_TRANSFER", "amount": 30000, "transactionCode": "PCN1023" }
  ]
}
```

Rules:
- Tổng `payment amount` ≤ `totalAmount`
- Nếu `paidAmount = totalAmount` → `paymentStatus = PAID`
- Nếu `paidAmount < totalAmount` → `paymentStatus = PARTIAL`

### GET /orders/{orderId}/payments
**Xem danh sách thanh toán của đơn**

### GET /payments
**OWNER xem lịch sử thanh toán**

Query: `?fromDate=2026-06-01&toDate=2026-06-22&method=CASH&shiftId=1`

---

## Payment QR API

Sinh QR chuyển khoản

### GET /orders/{orderId}/payment-qr
**Sinh QR theo số tiền còn cần thanh toán**

Response:
```json
{ "amount": 50000, "content": "PCN1023", "qrUrl": "https://img.vietqr.io/image/..." }
```

Lưu ý:
- MVP chỉ hiển thị QR đúng số tiền
- Chưa tự động xác nhận nếu chưa tích hợp ngân hàng

---

## Refund API

Hoàn tiền

### POST /orders/{orderId}/refunds
**Tạo hoàn tiền**

Body:
```json
{ "amount": 30000, "method": "CASH", "reason": "Làm sai món" }
```

Rules:
- Số tiền hoàn ≤ số tiền đã thanh toán
- Hoàn tiền phải có lý do

### GET /orders/{orderId}/refunds
**Xem lịch sử hoàn tiền của đơn**

### GET /refunds
**OWNER xem danh sách hoàn tiền**

Query: `?fromDate=2026-06-01&toDate=2026-06-22&shiftId=1&method=CASH`

---

## Expense API

Quản lý chi phí

### GET /expenses
**Lấy danh sách chi phí**

Query: `?fromDate=2026-06-01&toDate=2026-06-22&type=PACKAGING&shiftId=1`

### POST /expenses
**Tạo khoản chi**

Body:
```json
{ "type": "PACKAGING", "amount": 120000, "paymentMethod": "CASH", "shiftId": 1, "note": "Mua thêm hộp nhỏ" }
```

Type: `INGREDIENT` | `PACKAGING` | `GAS` | `ELECTRICITY` | `WATER` | `SALARY` | `OTHER`

### GET /expenses/{id}
**Xem chi tiết khoản chi**

### PUT /expenses/{id}
**Cập nhật khoản chi**

### DELETE /expenses/{id}
**Xóa khoản chi**

---

## Inventory API

Quản lý vật tư: hộp, túi, thìa

### GET /inventory-items
**Lấy danh sách vật tư**

### POST /inventory-items
**Tạo vật tư**

Body:
```json
{ "name": "Hộp nhỏ", "unit": "cái", "warningQuantity": 50 }
```

### GET /inventory-items/{id}
**Xem chi tiết vật tư**

### PUT /inventory-items/{id}
**Cập nhật vật tư**

### PATCH /inventory-items/{id}/status
**Bật/tắt vật tư**

### DELETE /inventory-items/{id}
**Xóa mềm vật tư**

### GET /inventory-items/low-stock
**Lấy danh sách vật tư sắp hết**

---

## Stock Movement API

Nhập/xuất/điều chỉnh vật tư

### GET /stock-movements
**Lấy lịch sử nhập/xuất kho**

Query: `?inventoryItemId=1&type=IN&fromDate=2026-06-01&toDate=2026-06-22`

### POST /inventory-items/{id}/stock-in
**Nhập vật tư**

Body:
```json
{ "quantity": 500, "unitPrice": 800, "reason": "Nhập hộp nhỏ" }
```

### POST /inventory-items/{id}/stock-out
**Xuất/hao hụt vật tư**

Body:
```json
{ "quantity": 20, "reason": "Hỏng/mất" }
```

### POST /inventory-items/{id}/adjust
**Kiểm kho và điều chỉnh số lượng thực tế**

Body:
```json
{ "actualQuantity": 430, "reason": "Kiểm kho cuối tuần" }
```

---

## Report API

Báo cáo cho chủ cửa hàng

### GET /reports/dashboard
**Dashboard tổng quan**

Query: `?date=2026-06-22`

Response: `todayRevenue`, `todayOrders`, `cashRevenue`, `bankRevenue`, `todayExpenses`, `estimatedProfit`, `topProducts`, `openShift`, `lowStockItems`

### GET /reports/revenue
**Báo cáo doanh thu theo thời gian**

Query: `?fromDate=2026-06-01&toDate=2026-06-22&groupBy=DAY`

GroupBy: `DAY` | `WEEK` | `MONTH`

### GET /reports/revenue-by-payment-method
**Doanh thu theo phương thức thanh toán**

Query: `?fromDate=2026-06-01&toDate=2026-06-22`

### GET /reports/top-products
**Top món bán chạy**

Query: `?fromDate=2026-06-01&toDate=2026-06-22&limit=10`

### GET /reports/hourly-sales
**Doanh thu theo khung giờ**

Query: `?date=2026-06-22`

### GET /reports/shift-summary
**Báo cáo theo ca**

Query: `?fromDate=2026-06-01&toDate=2026-06-22&userId=2`

### GET /reports/profit-estimate
**Lợi nhuận ước tính**

Query: `?fromDate=2026-06-01&toDate=2026-06-22`

Formula: `Lợi nhuận = Doanh thu thực nhận - Tổng chi phí`

### GET /reports/cancel-refund
**Báo cáo đơn hủy và hoàn tiền**

Query: `?fromDate=2026-06-01&toDate=2026-06-22`

---

## Activity Log API

Dành cho OWNER

### GET /activity-logs
**Xem log thao tác**

Query: `?userId=2&action=CANCEL_ORDER&fromDate=2026-06-01&toDate=2026-06-22`

### GET /activity-logs/{id}
**Xem chi tiết log**

---

## Settings API

### GET /settings/store
**Lấy thông tin cửa hàng**

### PUT /settings/store
**Cập nhật thông tin cửa hàng**

Body:
```json
{ "storeName": "PizzaChaoNgon", "address": "Hà Nội", "phone": "0900000000", "invoiceFooter": "Cảm ơn quý khách!" }
```

### GET /settings/payment
**Lấy thông tin thanh toán**

### PUT /settings/payment
**Cập nhật thông tin thanh toán**

Body:
```json
{ "bankCode": "MB", "bankAccountNumber": "123456789", "bankAccountName": "NGUYEN VAN A", "transferContentPrefix": "PCN" }
```

---

## File Upload API

Dùng cho ảnh món, logo, ảnh hóa đơn chi phí

### POST /files/upload
**Upload file**

Form-data: `file`, `type=PRODUCT_IMAGE | STORE_LOGO | EXPENSE_RECEIPT`

Response:
```json
{ "url": "https://..." }
```

---

## MVP Priority

Nếu muốn code theo thứ tự hợp lý, làm trước các endpoint này:

1. POST /auth/login
2. GET /auth/me
3. GET /product-categories
4. POST /product-categories
5. GET /sizes
6. POST /sizes
7. GET /products/pos
8. GET /products
9. POST /products
10. PUT /products/{id}
11. PATCH /products/{id}/status
12. GET /products/{productId}/variants
13. POST /products/{productId}/variants
14. PUT /product-variants/{id}
15. POST /shifts/open
16. GET /shifts/current
17. GET /shifts/{id}/summary
18. POST /shifts/{id}/close
19. POST /orders
20. GET /orders/queue/current-shift
21. GET /orders/{id}
22. PATCH /orders/{id}/queue-status
23. PATCH /orders/{id}/complete
24. POST /orders/{id}/cancel
25. POST /orders/{orderId}/payments
26. GET /orders/{orderId}/payment-qr
27. POST /expenses
28. GET /expenses
29. GET /reports/dashboard
30. GET /reports/revenue
31. GET /reports/top-products

---

## Design Notes

### Nguyên tắc thiết kế

**KHÔNG** tạo endpoint quá vụn cho những nghiệp vụ chưa cần:

❌ Sai:
- `/kitchen/orders`
- `/kitchen/status`
- Role: `KITCHEN_STAFF`, `INVENTORY_STAFF`, `VIEWER`

✅ Đúng:
- `/orders/queue/current-shift`
- `/orders/{id}/queue-status`
- Role: `OWNER`, `STAFF`

### Core Business Rules

Backend phải xử lý chắc những điểm này:

1. **Mở ca** → Nhân viên phải mở ca trước khi bán
2. **Tạo đơn trong ca** → Chỉ tạo được khi ca OPEN
3. **Thanh toán** → Tính toán tiền thừa/thiếu chính xác
4. **Đơn chờ** → Tracking trạng thái thời thực
5. **Đóng ca** → Kiểm soát tiền mặt, không tạo đơn sau đóng
6. **Đối soát tiền** → Chủ xác nhận ca, ghi lại chênh lệch
7. **Báo cáo doanh thu** → Chính xác theo ca, ngày, tháng
