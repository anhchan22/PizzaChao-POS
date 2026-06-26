Tức là thay vì có nút **“Điều chỉnh tồn”** riêng trên trang kho, bạn bắt nhân viên **đếm cốc khi đóng ca**, nhập luôn cùng lúc với **đếm tiền trong két**. Sau đó backend lấy số đếm thực tế đó để cập nhật tồn kho.

Như vậy chuẩn hơn, vì cuối ca vốn là lúc cần đối soát:

```text
Đối soát tiền mặt
+ Đối soát cốc/hộp/túi/thìa
```

## Logic nên là thế này

Ví dụ đầu ca hệ thống ghi:

```text
Cốc size M còn: 500
```

Trong ca bán 2 đơn size M, hệ thống dự kiến đã dùng:

```text
Đã dùng dự kiến: 2
```

Vậy tồn dự kiến cuối ca:

```text
500 - 2 = 498
```

Khi đóng ca, nhân viên đếm thực tế:

```text
Cốc size M thực tế còn: 497
```

Backend tính lệch:

```text
497 - 498 = -1
```

Nghĩa là thiếu 1 cốc so với dự kiến.

Sau khi đóng ca, backend cập nhật:

```text
inventory_items.current_quantity = 497
```

Đồng thời ghi log/lịch sử kho:

```text
type = SHIFT_CLOSE_ADJUST
reason = "Kiểm kho khi đóng ca #123"
before_quantity = 498
after_quantity = 497
difference = -1
```

## Vậy trang kho vật tư nên hiển thị gì?

Trang kho chỉ cần hiển thị **kết quả hiện tại**, không cần show logic dự kiến.

Bảng nên còn:

| Vật tư     | Tồn hiện tại | Đơn vị | Trạng thái | Cập nhật cuối    | Thao tác            |
| ---------- | -----------: | ------ | ---------- | ---------------- | ------------------- |
| Cốc size S |          500 | cái    | Còn hàng   | 26/06/2026 13:13 | Nhập hàng / Lịch sử |
| Cốc size M |          497 | cái    | Còn hàng   | 26/06/2026 13:13 | Nhập hàng / Lịch sử |
| Cốc size L |          200 | cái    | Còn hàng   | 26/06/2026 13:13 | Nhập hàng / Lịch sử |

Nên bỏ khỏi bảng chính:

```text
Tồn nhập tay
Đã dùng dự kiến
Tồn dự kiến
Ngưỡng cảnh báo
Rule theo size
```

Vì mấy cái đó là logic nội bộ, không cần phơi ra ngoài.

## Màn đóng ca nên thêm phần kiểm vật tư

Màn đóng ca sẽ có 2 phần:

### 1. Đối soát tiền

```text
Tiền đầu ca
Doanh thu tiền mặt
Doanh thu chuyển khoản
Chi trong ca
Tiền mặt dự kiến
Tiền mặt thực tế
Chênh lệch
Ghi chú
```

### 2. Kiểm vật tư cuối ca

| Vật tư     | Tồn dự kiến | Nhân viên đếm thực tế | Chênh lệch |
| ---------- | ----------: | --------------------: | ---------: |
| Cốc size S |         500 |           [ nhập số ] |    tự tính |
| Cốc size M |         498 |           [ nhập số ] |    tự tính |
| Cốc size L |         200 |           [ nhập số ] |    tự tính |

Ở đây **“Tồn dự kiến” có thể hiện ở màn đóng ca**, vì nhân viên cần biết để đối chiếu. Nhưng **không cần hiện ở trang kho chính**.

## Backend nên xử lý ra sao?

Khi đóng ca, request nên như này:

```json
{
  "actualCash": 1860000,
  "closingNote": "Thiếu 20k",
  "inventoryCounts": [
    {
      "inventoryItemId": 1,
      "actualQuantity": 500,
      "note": "Đủ"
    },
    {
      "inventoryItemId": 2,
      "actualQuantity": 497,
      "note": "Thiếu 1 cốc"
    },
    {
      "inventoryItemId": 3,
      "actualQuantity": 200,
      "note": ""
    }
  ]
}
```

Endpoint:

```text
POST /shifts/{id}/close
```

Không cần tạo endpoint riêng kiểu nhân viên tự chỉnh kho lung tung.

## Nên thêm bảng nào?

Nên thêm bảng `shift_inventory_counts`.

### `shift_inventory_counts`

| Field               | Ý nghĩa                  |
| ------------------- | ------------------------ |
| id                  | PK                       |
| shift_id            | Ca bán                   |
| inventory_item_id   | Vật tư                   |
| expected_quantity   | Tồn dự kiến cuối ca      |
| actual_quantity     | Số nhân viên đếm thực tế |
| difference_quantity | Chênh lệch               |
| note                | Ghi chú                  |
| created_by          | Nhân viên đóng ca        |
| created_at          | Thời gian ghi nhận       |

Bảng này rất đáng có, vì sau này chủ xem lại ca sẽ biết:

```text
Ca này tiền có lệch không?
Cốc có lệch không?
Ai đóng ca?
Lệch bao nhiêu?
```

## `stock_movements` vẫn giữ

Vẫn cần `stock_movements`, nhưng không để nhân viên tự điều chỉnh tùy tiện.

Các loại movement nên có:

```text
IN                 nhập hàng
OUT                xuất/hao hụt ngoài ca
AUTO_DEDUCT        tự trừ khi bán hàng
SHIFT_CLOSE_ADJUST điều chỉnh theo số đếm cuối ca
```

Khi đóng ca, nếu số đếm thực tế khác số hệ thống dự kiến, backend tạo movement:

```text
type = SHIFT_CLOSE_ADJUST
```

## Chốt thiết kế đúng

Bạn nên làm như này:

```text
Trang kho vật tư:
- Chỉ xem tồn hiện tại
- Nhập hàng
- Xem lịch sử

Màn đóng ca:
- Nhập tiền mặt thực tế
- Nhập số cốc/túi/thìa đếm thực tế
- Backend tự tính lệch
- Backend cập nhật tồn kho

Backend:
- Không bắt chủ tự cộng tồn
- Không bắt nhân viên chỉnh kho thủ công
- Mọi thay đổi tồn phải sinh stock_movements
```

