PizzaChaoNgon là nền tảng quản lý bán hàng hiện đại dành cho cửa hàng cháo dinh dưỡng, tập trung tối ưu quy trình bán hàng, mở ca, đóng ca và đối soát doanh thu. Hệ thống cung cấp trải nghiệm POS nhanh chóng, chính xác cho nhân viên, đồng thời hỗ trợ chủ cửa hàng theo dõi doanh thu, quản lý món bán, kiểm soát chi phí, nguyên liệu và phân tích hiệu quả kinh doanh thông qua hệ thống báo cáo trực quan.

---------
# PizzaChaoNgon - Hệ thống POS quản lý cửa hàng cháo dinh dưỡng
## MUST HAVE (M)

### M1: Module Authentication & User Roles — Đăng nhập và phân quyền

**M1.1:** Cho phép nhân viên/chủ cửa hàng đăng nhập vào hệ thống.
**M1.2:** Phân quyền tài khoản theo vai trò:

* **Owner/Admin:** quản lý toàn bộ hệ thống, doanh thu, nhân viên, món bán, chi phí.
* **Cashier/Nhân viên bán hàng:** tạo đơn, thanh toán, mở ca, đóng ca, xem danh sách món cần chuẩn bị.


**M1.3:** Mỗi vai trò chỉ thấy các chức năng phù hợp.
**M1.4:** Admin có quyền khóa/mở tài khoản nhân viên.
**M1.5:** Ghi nhận lịch sử đăng nhập và thao tác quan trọng.

---

### M2: Module Menu Management — Quản lý món bán

**M2.1:** Tạo, sửa, xóa món cháo/sản phẩm bán kèm.
**M2.2:** Phân loại món theo danh mục:

* Cháo gà
* Cháo bò
* Cháo cá
* Cháo tôm
* Cháo rau củ
* Đồ ăn kèm
* Đồ uống
* Combo

**M2.3:** Quản lý size/phần ăn:

* Nhỏ
* Vừa
* Lớn

**M2.4:** Cấu hình giá theo từng size.
**M2.5:** Cấu hình topping/thêm bớt, ví dụ:

* Thêm thịt
* Không hành
* Không tiêu
* Cháo xay nhuyễn
* Ít muối

**M2.6:** Cập nhật trạng thái món:

* Đang bán
* Tạm hết
* Ngừng bán

**M2.7:** Hiển thị món theo dạng nút lớn trên màn hình POS để nhân viên bán nhanh.

---

### M3: Module POS Order — Tạo và xử lý đơn bán hàng

**M3.1:** Tạo đơn bán hàng trực tiếp tại quầy.
**M3.2:** Thêm/xóa/sửa món trong đơn.
**M3.3:** Thêm ghi chú cho từng món hoặc toàn bộ đơn.
**M3.4:** Tự động tính tổng tiền đơn hàng.
**M3.5:** Hỗ trợ giảm giá theo số tiền hoặc phần trăm.
**M3.6:** Hỗ trợ nhiều trạng thái đơn hàng:

* Đang tạo
* Chờ thanh toán
* Đã thanh toán
* Đang chuẩn bị
* Hoàn thành
* Đã hủy
* Đã hoàn tiền

**M3.7:** Cho phép tìm kiếm lại đơn hàng theo mã đơn, thời gian, nhân viên hoặc phương thức thanh toán.
**M3.8:** Mỗi đơn hàng phải gắn với nhân viên tạo đơn và ca bán hiện tại.

---

### M4: Module Payment — Thanh toán

**M4.1:** Hỗ trợ thanh toán bằng tiền mặt.
**M4.2:** Hỗ trợ thanh toán bằng chuyển khoản.
**M4.3:** Hỗ trợ thanh toán kết hợp, ví dụ một phần tiền mặt, một phần chuyển khoản.
**M4.4:** Ghi nhận số tiền khách đưa và tiền thừa khi thanh toán tiền mặt.
**M4.5:** Ghi nhận mã giao dịch hoặc ghi chú khi thanh toán chuyển khoản.
**M4.6:** Mỗi giao dịch thanh toán phải liên kết với một đơn hàng cụ thể.
**M4.7:** Cho phép in hóa đơn hoặc xuất hóa đơn đơn giản sau khi thanh toán.
**M4.8:** Không cho phép sửa thông tin thanh toán sau khi đơn đã hoàn tất, trừ Admin hoặc người có quyền.

---

### M5: Module Shift Management — Mở ca và đóng ca bán hàng

**M5.1:** Nhân viên phải mở ca trước khi bán hàng.
**M5.2:** Khi mở ca, nhân viên nhập:

* Tiền mặt đầu ca
* Thời gian mở ca
* Người mở ca
* Ghi chú đầu ca nếu có

**M5.3:** Trong một thời điểm, mỗi nhân viên hoặc mỗi quầy chỉ có một ca đang mở.
**M5.4:** Toàn bộ đơn hàng phát sinh phải được gắn vào ca bán hiện tại.
**M5.5:** Cho phép đóng ca khi kết thúc phiên bán hàng.
**M5.6:** Khi đóng ca, hệ thống tổng hợp:

* Tổng số đơn
* Tổng doanh thu
* Doanh thu tiền mặt
* Doanh thu chuyển khoản
* Số đơn hủy
* Số đơn hoàn tiền
* Tổng chi trong ca
* Tiền đầu ca
* Tiền mặt dự kiến
* Tiền mặt thực tế

**M5.7:** Sau khi đóng ca, nhân viên không được tạo thêm đơn vào ca đó.
**M5.8:** Admin có quyền xem toàn bộ lịch sử ca bán.

---

### M6: Module Cash Reconciliation — Đối soát tiền cuối ca

**M6.1:** Hệ thống tự tính tiền mặt dự kiến theo công thức:

Tiền mặt dự kiến = Tiền đầu ca + Doanh thu tiền mặt + Thu khác - Chi trong ca - Hoàn tiền mặt

**M6.2:** Nhân viên nhập số tiền mặt thực tế đếm được khi đóng ca.
**M6.3:** Hệ thống tự động tính chênh lệch thừa/thiếu.
**M6.4:** Nếu có chênh lệch, bắt buộc nhập lý do hoặc ghi chú.
**M6.5:** Admin có thể xem danh sách các ca bị lệch tiền.
**M6.6:** Ghi log người đóng ca, thời gian đóng ca và số tiền chênh lệch.
**M6.7:** Không cho phép sửa kết quả đối soát sau khi ca đã được xác nhận, trừ Admin.

---

### M7: Module Order Cancellation / Refund — Hủy đơn và hoàn tiền

**M7.1:** Cho phép hủy đơn khi khách đổi ý hoặc nhân viên nhập sai.
**M7.2:** Khi hủy đơn, bắt buộc chọn hoặc nhập lý do hủy.
**M7.3:** Cho phép hoàn tiền đối với đơn đã thanh toán.
**M7.4:** Ghi nhận phương thức hoàn tiền:

* Hoàn tiền mặt
* Hoàn chuyển khoản
* Hoàn một phần

**M7.5:** Chỉ Admin hoặc nhân viên có quyền mới được hoàn tiền.
**M7.6:** Mọi thao tác hủy đơn/hoàn tiền phải được ghi log.
**M7.7:** Báo cáo doanh thu phải tách rõ doanh thu thực nhận, đơn hủy và tiền hoàn.

---

### M8: Module Revenue Dashboard — Thống kê doanh thu

**M8.1:** Hiển thị doanh thu hôm nay trên dashboard.
**M8.2:** Hiển thị doanh thu theo ca bán.
**M8.3:** Hiển thị doanh thu theo ngày, tuần, tháng.
**M8.4:** Thống kê doanh thu theo phương thức thanh toán:

* Tiền mặt
* Chuyển khoản
* Thanh toán kết hợp

**M8.5:** Thống kê số lượng đơn hàng.
**M8.6:** Thống kê món bán chạy.
**M8.7:** Thống kê khung giờ bán chạy.
**M8.8:** Hiển thị số đơn hủy, số đơn hoàn tiền.
**M8.9:** Cho phép lọc báo cáo theo thời gian, nhân viên, ca bán, món bán.
**M8.10:** Hỗ trợ biểu đồ trực quan để chủ cửa hàng dễ theo dõi.

---

### M9: Module Expense Management — Quản lý chi phí

**M9.1:** Cho phép ghi nhận chi phí phát sinh trong ngày hoặc trong ca.
**M9.2:** Phân loại chi phí:

* Mua nguyên liệu
* Mua hộp/túi/thìa
* Tiền gas/điện/nước
* Lương nhân viên
* Chi phí vận chuyển
* Chi phí phát sinh khác

**M9.3:** Mỗi khoản chi có thông tin:

* Số tiền
* Loại chi phí
* Người tạo
* Thời gian
* Ghi chú
* Ảnh hóa đơn nếu có

**M9.4:** Khoản chi có thể gắn với một ca bán cụ thể.
**M9.5:** Báo cáo lợi nhuận ước tính dựa trên doanh thu và chi phí.
**M9.6:** Admin có quyền sửa/xóa khoản chi, nhân viên thường chỉ được tạo khoản chi nếu được phân quyền.

---

### M10: Module Activity Log — Nhật ký thao tác

**M10.1:** Ghi log các thao tác quan trọng trong hệ thống.
**M10.2:** Các thao tác cần ghi log gồm:

* Đăng nhập
* Mở ca
* Đóng ca
* Tạo đơn
* Hủy đơn
* Hoàn tiền
* Sửa giá món
* Thêm/xóa món
* Nhập kho
* Sửa chi phí
* Sửa thông tin nhân viên

**M10.3:** Mỗi log cần có:

* Người thực hiện
* Hành động
* Thời gian
* Dữ liệu trước khi sửa
* Dữ liệu sau khi sửa

**M10.4:** Admin có thể xem và lọc lịch sử thao tác.
**M10.5:** Nhân viên thường không được xóa log.

---

## SHOULD HAVE (S)

### S1: Module Inventory Management — Quản lý nguyên liệu

**S1.1:** Quản lý danh sách nguyên liệu:
* Hộp nhỏ
* Hộp to
* Hộp vừa
* Túi
* Thìa

**S1.2:** Ghi nhận nhập kho nguyên liệu.
**S1.3:** Ghi nhận xuất kho hoặc hao hụt nguyên liệu.
**S1.4:** Theo dõi số lượng tồn kho hiện tại.
**S1.5:** Cảnh báo nguyên liệu sắp hết.
**S1.6:** Cảnh báo nguyên liệu gần hết hạn nếu có hạn sử dụng.
**S1.7:** Cho phép kiểm kho và điều chỉnh tồn kho thực tế.
**S1.8:** Ghi nhận nhà cung cấp và giá nhập nguyên liệu.


---

### S3: Module Customer Management — Quản lý khách hàng (Cái này để cuối đi chưa cần)

**S3.1:** Lưu thông tin khách hàng quen.
**S3.2:** Thông tin khách hàng gồm:

* Họ tên
* Số điện thoại
* Địa chỉ
* Ghi chú khẩu vị
* Lịch sử mua hàng

**S3.3:** Gắn khách hàng vào đơn hàng.
**S3.4:** Tìm kiếm khách hàng theo tên hoặc số điện thoại.
**S3.5:** Ghi chú thói quen khách hàng, ví dụ:

* Bé không ăn hành
* Cháo xay nhuyễn
* Ít muối
* Hay mua cháo gà buổi sáng

**S3.6:** Thống kê khách hàng mua nhiều nhất.
**S3.7:** Hỗ trợ quản lý công nợ khách quen nếu cửa hàng có bán ghi nợ.

---

### S5: Module Kitchen View — Màn hình bếp

**S5.1:** Nhân viên bếp có màn hình riêng để xem món cần chuẩn bị.
**S5.2:** Đơn hàng mới sau khi thanh toán được gửi sang màn hình bếp.
**S5.3:** Hiển thị món, size, topping và ghi chú rõ ràng.
**S5.4:** Nhân viên bếp có thể cập nhật trạng thái:

* Chưa làm
* Đang chuẩn bị
* Đã xong

**S5.5:** Sắp xếp đơn theo thời gian tạo.
**S5.6:** Đánh dấu đơn ưu tiên nếu khách đặt trước hoặc đang chờ lâu.

Không cần màn hình bếp vì quán cháo chỉ có 1 nhân viên 1 ca, tôi muốn chuyển chức năng này thành màn hình quản lí đơn chờ, ví dụ khi đôg khách đến mua hàng 1 lúc sẽ tạo đơn cho mn trước sau đó mới nhìn vào thứ tự đơn để hoàn thiện, chứ bấm 1 đơn xong làm xong đơn mới bấm tiếp thì ko hay lắm

---

### S6: Module QR Payment — Thanh toán QR

**S6.1:** Hiển thị mã QR chuyển khoản tại màn hình thanh toán.
**S6.2:** Nội dung chuyển khoản tự động chứa mã đơn hàng.
**S6.3:** Nhân viên có thể đánh dấu đã nhận chuyển khoản.
**S6.4:** Ghi nhận mã giao dịch hoặc ảnh xác nhận nếu cần.
**S6.5:** Báo cáo cuối ca tách riêng tiền mặt và chuyển khoản.
**S6.6:** Hạn chế nhầm lẫn giữa đơn đã chuyển khoản và đơn chưa thanh toán.
Nếu modul này tự hiển thị số tiền cần thanh toán khi quét qr thì hay

---

### S7: Module Advanced Report — Báo cáo nâng cao

**S7.1:** So sánh doanh thu hôm nay với hôm qua.
**S7.2:** So sánh doanh thu tháng này với tháng trước.
**S7.3:** Báo cáo top món bán chạy.
**S7.4:** Báo cáo món bán chậm.
**S7.5:** Báo cáo doanh thu theo khung giờ.
**S7.6:** Báo cáo hiệu suất theo nhân viên.
**S7.7:** Báo cáo lợi nhuận ước tính theo ngày/tháng.
**S7.8:** Hỗ trợ xuất báo cáo Excel hoặc PDF.


---

### C6: Module Mobile Owner View — Giao diện mobile cho chủ cửa hàng (cái này để sau nhé)

**C6.1:** Chủ cửa hàng có thể xem nhanh doanh thu trên điện thoại.
**C6.2:** Hiển thị doanh thu hôm nay, số đơn, món bán chạy.
**C6.3:** Cảnh báo ca bán lệch tiền hoặc đơn hoàn bất thường.
**C6.4:** Cho phép xem lịch sử ca bán từ xa.
**C6.5:** Không cho phép thao tác nhạy cảm trên mobile nếu chưa xác thực lại.

---


## GỢI Ý PHẠM VI MVP

Phiên bản MVP nên tập trung vào các module sau:

* M1: Đăng nhập và phân quyền
* M2: Quản lý món bán
* M3: Tạo đơn POS
* M4: Thanh toán
* M5: Mở ca / đóng ca
* M6: Đối soát tiền cuối ca
* M7: Hủy đơn / hoàn tiền
* M8: Báo cáo doanh thu
* M9: Quản lý chi phí cơ bản
* M10: Nhật ký thao tác
---------------
# DATABASE DESIGN — PizzaChaoNgon POS

## 1. Tổng quan database

Hệ thống nên có các nhóm bảng chính:

```text
1. Người dùng & phân quyền
2. Sản phẩm, size, giá bán
3. Ca bán
4. Đơn hàng
5. Thanh toán
6. Hoàn tiền / hủy đơn
7. Chi phí
8. Vật tư
9. Nhật ký thao tác
10. Cài đặt cửa hàng / QR thanh toán
```

---

# 2. Danh sách bảng chính

## 2.1. users

Lưu tài khoản chủ cửa hàng và nhân viên.

| Field         | Type         | Ghi chú               |
| ------------- | ------------ | --------------------- |
| id            | BIGINT       | PK                    |
| username      | VARCHAR(100) | Tên đăng nhập, unique |
| password_hash | VARCHAR(255) | Mật khẩu đã mã hóa    |
| full_name     | VARCHAR(150) | Họ tên                |
| phone         | VARCHAR(20)  | Số điện thoại         |
| role          | VARCHAR(20)  | OWNER, STAFF          |
| status        | VARCHAR(20)  | ACTIVE, INACTIVE      |
| created_at    | DATETIME     | Ngày tạo              |
| updated_at    | DATETIME     | Ngày cập nhật         |

Role chỉ cần:

```text
ADMIN
STAFF
```

---

## 2.2. product_categories

Danh mục món.

| Field         | Type         | Ghi chú          |
| ------------- | ------------ | ---------------- |
| id            | BIGINT       | PK               |
| name          | VARCHAR(100) | Tên danh mục     |
| description   | TEXT         | Mô tả            |
| display_order | INT          | Thứ tự hiển thị  |
| status        | VARCHAR(20)  | ACTIVE, INACTIVE |
| created_at    | DATETIME     | Ngày tạo         |
| updated_at    | DATETIME     | Ngày cập nhật    |

Ví dụ:

```text
Cháo trẻ em
Cháo người lớn
Đồ ăn khác
Đồ uống
Đồ ăn kèm
Combo
```

---

## 2.3. sizes

Lưu các size/phần ăn.

| Field         | Type        | Ghi chú          |
| ------------- | ----------- | ---------------- |
| id            | BIGINT      | PK               |
| name          | VARCHAR(50) | Nhỏ, vừa, lớn    |
| display_order | INT         | Thứ tự hiển thị  |
| status        | VARCHAR(20) | ACTIVE, INACTIVE |
| created_at    | DATETIME    | Ngày tạo         |
| updated_at    | DATETIME    | Ngày cập nhật    |

Ví dụ:

```text
Nhỏ
Vừa
Lớn
```

Có 1 số món sẽ ko có size (chỉ cháo mới có size, có loại cháo chỉ có size vừa và lớn)

---

## 2.4. products

Lưu món gốc.

| Field         | Type         | Ghi chú                    |
| ------------- | ------------ | -------------------------- |
| id            | BIGINT       | PK                         |
| category_id   | BIGINT       | FK → product_categories.id |
| name          | VARCHAR(150) | Tên món                    |
| description   | TEXT         | Mô tả                      |
| image_url     | VARCHAR(255) | Ảnh món                    |
| status        | VARCHAR(20)  | ACTIVE, SOLD_OUT, INACTIVE |
| display_order | INT          | Thứ tự hiển thị trên POS   |
| created_at    | DATETIME     | Ngày tạo                   |
| updated_at    | DATETIME     | Ngày cập nhật              |

Ví dụ:

```text
Cháo chim
Cháo cá hồi
Cháo tổ yến
Cháo bò
Cháo gà
Mỳ gà tần
Óc hầm ngải
```

---

## 2.5. product_variants

Lưu giá theo từng size của từng món.

| Field      | Type          | Ghi chú          |
| ---------- | ------------- | ---------------- |
| id         | BIGINT        | PK               |
| product_id | BIGINT        | FK → products.id |
| size_id    | BIGINT        | FK → sizes.id    |
| price      | DECIMAL(12,2) | Giá bán          |
| status     | VARCHAR(20)   | ACTIVE, INACTIVE |
| created_at | DATETIME      | Ngày tạo         |
| updated_at | DATETIME      | Ngày cập nhật    |

Ràng buộc nên có:

```text
UNIQUE(product_id, size_id)
```

Ví dụ dữ liệu:

| product     | size | price |
| ----------- | ---- | ----: |
| Cháo chim   | Nhỏ  | 18000 |
| Cháo chim   | Vừa  | 25000 |
| Cháo chim   | Lớn  | 30000 |
| Cháo cá hồi | Nhỏ  | 23000 |
| Cháo cá hồi | Vừa  | 30000 |
| Cháo cá hồi | Lớn  | 35000 |
| Cháo tổ yến | Nhỏ  | 30000 |
| Cháo tổ yến | Vừa  | 40000 |
| Cháo tổ yến | Lớn  | 50000 |

Đây là bảng rất quan trọng. Khi bán hàng, nhân viên chọn `product_variant`, không chọn mỗi `product`.

Nếu món chỉ có 1, hoặc 2 size thì sao nhỉ(hoặc là ko có size)

---

## 2.6. product_options

Lưu topping hoặc tùy chọn thêm/bớt.

| Field       | Type          | Ghi chú                      |
| ----------- | ------------- | ---------------------------- |
| id          | BIGINT        | PK                           |
| name        | VARCHAR(100)  | Tên tùy chọn                 |
| price_delta | DECIMAL(12,2) | Giá cộng thêm, có thể bằng 0 |
| status      | VARCHAR(20)   | ACTIVE, INACTIVE             |
| created_at  | DATETIME      | Ngày tạo                     |
| updated_at  | DATETIME      | Ngày cập nhật                |

Ví dụ:

```text
Thêm thịt: +5000
Không hành: +0
Không tiêu: +0
Cháo xay nhuyễn: +0
Thêm trứng: +7000
```

---

# 3. Ca bán

## 3.1. shifts

Lưu ca bán của nhân viên.

| Field            | Type          | Ghi chú                             |
| ---------------- | ------------- | ----------------------------------- |
| id               | BIGINT        | PK                                  |
| user_id          | BIGINT        | FK → users.id                       |
| opened_at        | DATETIME      | Thời gian mở ca                     |
| closed_at        | DATETIME      | Thời gian đóng ca                   |
| opening_cash     | DECIMAL(12,2) | Tiền mặt đầu ca                     |
| expected_cash    | DECIMAL(12,2) | Tiền mặt dự kiến                    |
| actual_cash      | DECIMAL(12,2) | Tiền mặt thực tế khi đóng ca        |
| cash_difference  | DECIMAL(12,2) | Chênh lệch tiền                     |
| total_revenue    | DECIMAL(12,2) | Tổng doanh thu snapshot khi đóng ca |
| cash_revenue     | DECIMAL(12,2) | Doanh thu tiền mặt                  |
| bank_revenue     | DECIMAL(12,2) | Doanh thu chuyển khoản              |
| total_expense    | DECIMAL(12,2) | Tổng chi trong ca                   |
| total_refund     | DECIMAL(12,2) | Tổng hoàn tiền trong ca             |
| total_orders     | INT           | Tổng số đơn                         |
| cancelled_orders | INT           | Số đơn hủy                          |
| status           | VARCHAR(20)   | OPEN, CLOSED                        |
| opening_note     | TEXT          | Ghi chú mở ca                       |
| closing_note     | TEXT          | Ghi chú đóng ca                     |
| owner_confirmed  | BOOLEAN       | Chủ đã xác nhận ca hay chưa         |
| created_at       | DATETIME      | Ngày tạo                            |
| updated_at       | DATETIME      | Ngày cập nhật                       |

Các trường tổng như `total_revenue`, `cash_revenue`, `bank_revenue` có thể tính từ bảng orders/payments. Nhưng vẫn nên lưu snapshot khi đóng ca để sau này báo cáo nhanh và không bị lệch nếu dữ liệu cũ bị chỉnh.

Công thức đóng ca:

```text
expected_cash =
opening_cash
+ cash_revenue
- cash_refund
- cash_expense
```

---

# 4. Đơn hàng

## 4.1. orders

Lưu đơn hàng.

| Field           | Type          | Ghi chú                                             |
| --------------- | ------------- | --------------------------------------------------- |
| id              | BIGINT        | PK                                                  |
| order_code      | VARCHAR(50)   | Mã đơn, unique                                      |
| queue_number    | INT           | Số thứ tự đơn trong ca                              |
| shift_id        | BIGINT        | FK → shifts.id                                      |
| cashier_id      | BIGINT        | FK → users.id                                       |
| subtotal_amount | DECIMAL(12,2) | Tổng tiền hàng trước giảm                           |
| discount_amount | DECIMAL(12,2) | Giảm giá                                            |
| total_amount    | DECIMAL(12,2) | Tổng cần thanh toán                                 |
| paid_amount     | DECIMAL(12,2) | Tổng đã thanh toán                                  |
| refunded_amount | DECIMAL(12,2) | Tổng đã hoàn                                        |
| order_status    | VARCHAR(30)   | PENDING, PROCESSING, COMPLETED, CANCELLED, REFUNDED |
| payment_status  | VARCHAR(30)   | UNPAID, PARTIAL, PAID, REFUNDED                     |
| note            | TEXT          | Ghi chú đơn                                         |
| cancel_reason   | TEXT          | Lý do hủy                                           |
| created_at      | DATETIME      | Thời gian tạo                                       |
| completed_at    | DATETIME      | Thời gian hoàn thành                                |
| cancelled_at    | DATETIME      | Thời gian hủy                                       |
| updated_at      | DATETIME      | Ngày cập nhật                                       |

`queue_number` dùng cho màn đơn chờ.

Ví dụ:

```text
Ca sáng có các đơn:
#1
#2
#3
```

Nhân viên nhìn màn đơn chờ để làm lần lượt.

---

## 4.2. order_items

Lưu chi tiết món trong đơn.

| Field              | Type          | Ghi chú                  |
| ------------------ | ------------- | ------------------------ |
| id                 | BIGINT        | PK                       |
| order_id           | BIGINT        | FK → orders.id           |
| product_id         | BIGINT        | FK → products.id         |
| product_variant_id | BIGINT        | FK → product_variants.id |
| product_name       | VARCHAR(150)  | Snapshot tên món lúc bán |
| size_name          | VARCHAR(50)   | Snapshot size lúc bán    |
| unit_price         | DECIMAL(12,2) | Giá tại thời điểm bán    |
| quantity           | INT           | Số lượng                 |
| line_total         | DECIMAL(12,2) | Thành tiền               |
| note               | TEXT          | Ghi chú món              |

Phải lưu snapshot:

```text
product_name
size_name
unit_price
```

Lý do: sau này bạn sửa giá Cháo cá hồi nhỏ từ 23k lên 25k thì hóa đơn cũ vẫn phải giữ giá 23k.

---

## 4.3. order_item_options

Lưu topping/tùy chọn của từng món trong đơn.

| Field         | Type          | Ghi chú                         |
| ------------- | ------------- | ------------------------------- |
| id            | BIGINT        | PK                              |
| order_item_id | BIGINT        | FK → order_items.id             |
| option_id     | BIGINT        | FK → product_options.id         |
| option_name   | VARCHAR(100)  | Snapshot tên option             |
| price_delta   | DECIMAL(12,2) | Giá cộng thêm tại thời điểm bán |
| created_at    | DATETIME      | Ngày tạo                        |

Ví dụ:

```text
Order item: Cháo cá hồi nhỏ
Options:
- Không hành
- Thêm thịt +5000
```

---

# 5. Thanh toán và hoàn tiền

## 5.1. payments

Lưu các lần thanh toán.

| Field            | Type          | Ghi chú                        |
| ---------------- | ------------- | ------------------------------ |
| id               | BIGINT        | PK                             |
| order_id         | BIGINT        | FK → orders.id                 |
| shift_id         | BIGINT        | FK → shifts.id                 |
| method           | VARCHAR(30)   | CASH, BANK_TRANSFER            |
| amount           | DECIMAL(12,2) | Số tiền thanh toán             |
| received_amount  | DECIMAL(12,2) | Tiền khách đưa nếu là tiền mặt |
| change_amount    | DECIMAL(12,2) | Tiền thừa                      |
| transaction_code | VARCHAR(100)  | Mã giao dịch chuyển khoản      |
| note             | TEXT          | Ghi chú                        |
| created_by       | BIGINT        | FK → users.id                  |
| created_at       | DATETIME      | Thời gian thanh toán           |

Một đơn có thể có nhiều payment.

Ví dụ:

```text
Đơn 50k:
- Tiền mặt 20k
- Chuyển khoản 30k
```

---

## 5.2. refunds

Lưu hoàn tiền.

| Field      | Type          | Ghi chú             |
| ---------- | ------------- | ------------------- |
| id         | BIGINT        | PK                  |
| order_id   | BIGINT        | FK → orders.id      |
| shift_id   | BIGINT        | FK → shifts.id      |
| amount     | DECIMAL(12,2) | Số tiền hoàn        |
| method     | VARCHAR(30)   | CASH, BANK_TRANSFER |
| reason     | TEXT          | Lý do hoàn tiền     |
| created_by | BIGINT        | FK → users.id       |
| created_at | DATETIME      | Thời gian hoàn      |

---

# 6. Chi phí

## 6.1. expenses

Lưu khoản chi.

| Field             | Type          | Ghi chú                                                       |
| ----------------- | ------------- | ------------------------------------------------------------- |
| id                | BIGINT        | PK                                                            |
| shift_id          | BIGINT        | FK → shifts.id, nullable                                      |
| type              | VARCHAR(50)   | INGREDIENT, PACKAGING, GAS, ELECTRICITY, WATER, SALARY, OTHER |
| amount            | DECIMAL(12,2) | Số tiền                                                       |
| payment_method    | VARCHAR(30)   | CASH, BANK_TRANSFER                                           |
| note              | TEXT          | Ghi chú                                                       |
| receipt_image_url | VARCHAR(255)  | Ảnh hóa đơn nếu có                                            |
| created_by        | BIGINT        | FK → users.id                                                 |
| created_at        | DATETIME      | Ngày tạo                                                      |
| updated_at        | DATETIME      | Ngày sửa                                                      |

`shift_id` nullable vì có khoản chi ngoài ca, ví dụ cuối tháng trả tiền điện.

---

# 7. Vật tư

## 7.1. inventory_items

Lưu vật tư dễ đếm.

| Field            | Type         | Ghi chú                 |
| ---------------- | ------------ | ----------------------- |
| id               | BIGINT       | PK                      |
| name             | VARCHAR(100) | Tên vật tư              |
| unit             | VARCHAR(30)  | Đơn vị                  |
| current_quantity | INT          | Số lượng hiện tại       |
| warning_quantity | INT          | Ngưỡng cảnh báo sắp hết |
| status           | VARCHAR(20)  | ACTIVE, INACTIVE        |
| created_at       | DATETIME     | Ngày tạo                |
| updated_at       | DATETIME     | Ngày sửa                |

Ví dụ:

```text
Hộp nhỏ
Hộp vừa
Hộp to
Túi
Thìa
```

---

## 7.2. stock_movements

Lưu lịch sử nhập/xuất/điều chỉnh vật tư.

| Field             | Type          | Ghi chú                 |
| ----------------- | ------------- | ----------------------- |
| id                | BIGINT        | PK                      |
| inventory_item_id | BIGINT        | FK → inventory_items.id |
| type              | VARCHAR(20)   | IN, OUT, ADJUST         |
| quantity          | INT           | Số lượng thay đổi       |
| before_quantity   | INT           | Số lượng trước          |
| after_quantity    | INT           | Số lượng sau            |
| unit_price        | DECIMAL(12,2) | Giá nhập, nếu có        |
| reason            | TEXT          | Lý do                   |
| created_by        | BIGINT        | FK → users.id           |
| created_at        | DATETIME      | Thời gian thao tác      |

Ví dụ:

```text
IN: nhập 500 hộp nhỏ
OUT: xuất/hỏng 20 cái
ADJUST: kiểm kho, sửa số lượng thực tế
```

---

# 8. Nhật ký thao tác

## 8.1. activity_logs

Lưu lịch sử thao tác quan trọng.

| Field       | Type         | Ghi chú        |
| ----------- | ------------ | -------------- |
| id          | BIGINT       | PK             |
| user_id     | BIGINT       | FK → users.id  |
| action      | VARCHAR(100) | Tên hành động  |
| target_type | VARCHAR(100) | Loại đối tượng |
| target_id   | BIGINT       | ID đối tượng   |
| old_value   | TEXT/JSON    | Dữ liệu cũ     |
| new_value   | TEXT/JSON    | Dữ liệu mới    |
| ip_address  | VARCHAR(100) | IP nếu cần     |
| created_at  | DATETIME     | Thời gian      |

Các hành động nên log:

```text
LOGIN
OPEN_SHIFT
CLOSE_SHIFT
CREATE_ORDER
UPDATE_ORDER_STATUS
CANCEL_ORDER
CREATE_PAYMENT
CREATE_REFUND
CREATE_EXPENSE
UPDATE_PRODUCT_PRICE
STOCK_IN
STOCK_OUT
ADJUST_STOCK
```

---

# 9. Cài đặt cửa hàng

## 9.1. store_settings

Thông tin cửa hàng.

| Field          | Type         | Ghi chú               |
| -------------- | ------------ | --------------------- |
| id             | BIGINT       | PK                    |
| store_name     | VARCHAR(150) | Tên cửa hàng          |
| address        | TEXT         | Địa chỉ               |
| phone          | VARCHAR(20)  | Số điện thoại         |
| logo_url       | VARCHAR(255) | Logo                  |
| invoice_footer | TEXT         | Nội dung cuối hóa đơn |
| created_at     | DATETIME     | Ngày tạo              |
| updated_at     | DATETIME     | Ngày sửa              |

---

## 9.2. payment_settings

Thông tin thanh toán QR.

| Field                   | Type         | Ghi chú                       |
| ----------------------- | ------------ | ----------------------------- |
| id                      | BIGINT       | PK                            |
| bank_code               | VARCHAR(50)  | Mã ngân hàng                  |
| bank_account_number     | VARCHAR(100) | Số tài khoản                  |
| bank_account_name       | VARCHAR(150) | Tên chủ tài khoản             |
| qr_template             | VARCHAR(100) | Template QR nếu dùng VietQR   |
| transfer_content_prefix | VARCHAR(50)  | Tiền tố nội dung chuyển khoản |
| updated_at              | DATETIME     | Ngày cập nhật                 |

Ví dụ nội dung chuyển khoản:

```text
PCN1023
```

Hoặc:

```text
PIZZA-CHAO-ORDER-1023
```

---

# 10. Quan hệ chính giữa các bảng

```text
users 1 - n shifts
users 1 - n orders
users 1 - n payments
users 1 - n refunds
users 1 - n expenses
users 1 - n activity_logs

product_categories 1 - n products
products 1 - n product_variants
sizes 1 - n product_variants

orders 1 - n order_items
order_items 1 - n order_item_options

shifts 1 - n orders
shifts 1 - n payments
shifts 1 - n refunds
shifts 1 - n expenses

orders 1 - n payments
orders 1 - n refunds

inventory_items 1 - n stock_movements
```

---


# 13. Chốt schema MVP

Bản MVP hợp lý nhất gồm 18 bảng:

```text
users
product_categories
sizes
products
product_variants
product_options
shifts
orders
order_items
order_item_options
payments
refunds
expenses
inventory_items
stock_movements
activity_logs
store_settings
payment_settings
```
