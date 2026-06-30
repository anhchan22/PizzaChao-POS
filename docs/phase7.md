Được, chức năng **chấm công** rất hợp với hệ thống của bạn vì đã có sẵn nghiệp vụ **mở ca / đóng ca**. Không cần làm máy chấm công riêng. Cứ lấy dữ liệu từ `shifts` là hợp lý nhất.

# PLAN CHỨC NĂNG CHẤM CÔNG — PizzaChaoNgon POS

## 1. Mục tiêu chức năng

Chức năng chấm công dùng để tổng hợp thời gian làm việc của từng nhân viên dựa trên dữ liệu ca bán.

Công thức cơ bản:

```text
Số giờ làm = Thời gian đóng ca - Thời gian mở ca
```

Ví dụ:

```text
Mở ca: 05:30
Đóng ca: 12:00

Số giờ làm = 6 giờ 30 phút
```

Chức năng này giúp chủ cửa hàng:

* Biết mỗi nhân viên đã làm bao nhiêu giờ.
* Xem chi tiết từng ca làm.
* Tổng hợp giờ làm theo ngày, tuần, tháng.
* Hỗ trợ tính lương part-time nếu cần.

---

# 2. Phạm vi chức năng

## MUST HAVE

### M1: Tự động ghi nhận giờ làm từ ca bán

Khi nhân viên mở ca:

```text
opened_at = thời điểm mở ca
```

Khi nhân viên đóng ca:

```text
closed_at = thời điểm đóng ca
```

Backend tự tính:

```text
worked_minutes = closed_at - opened_at
```

Ví dụ:

```text
opened_at = 2026-06-26 05:30
closed_at = 2026-06-26 12:00

worked_minutes = 390 phút
worked_hours = 6.5 giờ
```

Không bắt nhân viên tự nhập số giờ làm.

---

### M2: Trang tổng hợp chấm công nhân viên

Tạo trang:

```text
/admin/attendance
```

Tên màn hình:

```text
Chấm công nhân viên
```

Trang này hiển thị danh sách nhân viên và tổng giờ làm trong khoảng thời gian đã chọn.

Bộ lọc cần có:

* Từ ngày.
* Đến ngày.
* Tháng hiện tại.
* Nhân viên.
* Trạng thái ca.

Bảng tổng hợp:

| Nhân viên   | Số ca đã làm | Tổng giờ làm | Trung bình/ca | Ca gần nhất | Thao tác     |
| ----------- | -----------: | -----------: | ------------: | ----------- | ------------ |
| Nhân viên A |           12 |     68.5 giờ |       5.7 giờ | 26/06/2026  | Xem chi tiết |
| Nhân viên B |            9 |       45 giờ |         5 giờ | 25/06/2026  | Xem chi tiết |

Các chỉ số đầu trang:

```text
Tổng nhân viên
Tổng số ca
Tổng giờ làm
Nhân viên làm nhiều giờ nhất
```

---

### M3: Trang chi tiết chấm công của từng nhân viên

Khi bấm vào một nhân viên, chuyển đến:

```text
/admin/attendance/:userId
```

Ví dụ:

```text
/admin/attendance/2
```

Trang này hiển thị chi tiết các ca nhân viên đó đã làm.

Thông tin đầu trang:

* Tên nhân viên.
* Số điện thoại.
* Tổng số ca trong kỳ.
* Tổng giờ làm trong kỳ.
* Trung bình giờ/ca.

Bảng chi tiết ca:

| Ngày       | Mở ca | Đóng ca | Số giờ làm | Doanh thu ca | Trạng thái | Ghi chú  |
| ---------- | ----- | ------- | ---------: | -----------: | ---------- | -------- |
| 26/06/2026 | 05:30 | 12:00   |    6.5 giờ |     850.000đ | Đã đóng    | Ca sáng  |
| 25/06/2026 | 13:00 | 21:00   |      8 giờ |   1.200.000đ | Đã đóng    | Ca chiều |

Chỉ tính giờ làm cho các ca đã đóng.

Ca chưa đóng thì hiển thị:

```text
Đang mở
```

và chưa tính vào tổng giờ.

---

### M4: Tính giờ làm tự động khi đóng ca

Luồng nghiệp vụ:

```text
Nhân viên mở ca
→ Bán hàng
→ Đóng ca
→ Backend tính worked_minutes
→ Lưu vào bảng shifts
→ Trang chấm công lấy dữ liệu từ shifts
```

Không nên tạo bảng chấm công riêng ngay từ đầu, vì `shifts` đã chính là dữ liệu ca làm.

---

### M5: Không cho sửa giờ làm tùy tiện

Nhân viên không được tự sửa giờ làm.

Chỉ `OWNER` được quyền:

* Xem toàn bộ chấm công.
* Xem chi tiết từng nhân viên.
* Điều chỉnh giờ làm nếu có lỗi đặc biệt.

Nếu có điều chỉnh thì phải ghi log.

---

## SHOULD HAVE

### S1: Tính lương part-time

Nếu muốn mở rộng, có thể thêm tính lương.

Ví dụ:

```text
Lương = Tổng giờ làm × Lương theo giờ
```

Thêm trường vào bảng `users`:

```text
hourly_wage
```

Ví dụ:

```text
hourly_wage = 25000
```

Bảng tổng hợp có thêm:

| Nhân viên   | Tổng giờ | Lương/giờ | Lương tạm tính |
| ----------- | -------: | --------: | -------------: |
| Nhân viên A | 68.5 giờ |   25.000đ |     1.712.500đ |

Công thức:

```text
estimated_salary = total_worked_hours × hourly_wage
```

Phần này nên để sau, không cần làm ngay nếu chỉ cần chấm công.

---

### S2: Ghi chú chấm công

Cho phép chủ cửa hàng ghi chú vào ca:

```text
Ca này nhân viên đến muộn 15 phút
Ca này đóng muộn do đông khách
Ca này quên đóng ca
```

Ghi chú này có thể dùng lại field `closing_note` trong `shifts`, hoặc tạo thêm field:

```text
attendance_note
```

---

### S3: Xuất Excel chấm công

Có thể thêm nút:

```text
Xuất Excel
```

Dữ liệu xuất:

* Tên nhân viên.
* Ngày làm.
* Giờ mở ca.
* Giờ đóng ca.
* Số giờ làm.
* Ghi chú.
* Tổng giờ trong kỳ.

Phần này để sau cũng được.

---

# 3. Database cần chỉnh

## Cách làm gọn nhất

Dùng lại bảng `shifts`.

Hiện tại bảng `shifts` đã có:

```text
id
user_id
opened_at
closed_at
opening_cash
actual_cash
status
opening_note
closing_note
```

Bổ sung thêm các field sau:

```text
worked_minutes
attendance_note
```

## Bảng shifts sau khi bổ sung

| Field           | Type     | Ghi chú           |
| --------------- | -------- | ----------------- |
| id              | BIGINT   | PK                |
| user_id         | BIGINT   | Nhân viên mở ca   |
| opened_at       | DATETIME | Thời gian mở ca   |
| closed_at       | DATETIME | Thời gian đóng ca |
| worked_minutes  | INT      | Số phút làm việc  |
| opening_cash    | DECIMAL  | Tiền mặt đầu ca   |
| expected_cash   | DECIMAL  | Tiền mặt dự kiến  |
| actual_cash     | DECIMAL  | Tiền mặt thực tế  |
| cash_difference | DECIMAL  | Lệch tiền         |
| total_revenue   | DECIMAL  | Tổng doanh thu ca |
| status          | VARCHAR  | OPEN, CLOSED      |
| opening_note    | TEXT     | Ghi chú mở ca     |
| closing_note    | TEXT     | Ghi chú đóng ca   |
| attendance_note | TEXT     | Ghi chú chấm công |
| created_at      | DATETIME | Ngày tạo          |
| updated_at      | DATETIME | Ngày sửa          |

## Có cần bảng attendance riêng không?

MVP: **không cần**.

Vì mỗi ca bán tương ứng với một lần làm việc.

```text
1 shift = 1 attendance record
```

Nếu tạo bảng `attendances` riêng ngay bây giờ thì hơi thừa.

Chỉ nên tách bảng `attendances` khi sau này có các trường hợp:

* Nhân viên đi làm nhưng không bán hàng.
* Có nhiều người cùng làm trong một ca.
* Có ca phụ không liên quan bán hàng.
* Có check-in/check-out riêng ngoài POS.

Hiện tại quán bạn mỗi ca thường 1 nhân viên bán, nên dùng `shifts` là đúng.

---

# 4. Backend API cần thêm

Base URL:

```text
/api/v1
```

---

## 4.1. Attendance Summary API

### GET /attendance/summary

Lấy tổng hợp giờ làm của toàn bộ nhân viên.

Query:

```text
?fromDate=2026-06-01&toDate=2026-06-30
```

Response ví dụ:

```json
{
  "fromDate": "2026-06-01",
  "toDate": "2026-06-30",
  "totalEmployees": 2,
  "totalShifts": 21,
  "totalWorkedMinutes": 6810,
  "employees": [
    {
      "userId": 2,
      "fullName": "Nhân viên A",
      "phone": "0900000001",
      "totalShifts": 12,
      "totalWorkedMinutes": 4110,
      "totalWorkedHours": 68.5,
      "averageHoursPerShift": 5.7,
      "lastShiftAt": "2026-06-26T12:00:00"
    },
    {
      "userId": 3,
      "fullName": "Nhân viên B",
      "phone": "0900000002",
      "totalShifts": 9,
      "totalWorkedMinutes": 2700,
      "totalWorkedHours": 45,
      "averageHoursPerShift": 5,
      "lastShiftAt": "2026-06-25T21:00:00"
    }
  ]
}
```

Rule:

```text
Chỉ tính các shift có status = CLOSED.
Không tính ca đang OPEN.
```

---

## 4.2. Employee Attendance Detail API

### GET /attendance/users/{userId}

Lấy chi tiết chấm công của một nhân viên.

Query:

```text
?fromDate=2026-06-01&toDate=2026-06-30
```

Response ví dụ:

```json
{
  "user": {
    "id": 2,
    "fullName": "Nhân viên A",
    "phone": "0900000001"
  },
  "summary": {
    "totalShifts": 12,
    "totalWorkedMinutes": 4110,
    "totalWorkedHours": 68.5,
    "averageHoursPerShift": 5.7
  },
  "shifts": [
    {
      "shiftId": 101,
      "workDate": "2026-06-26",
      "openedAt": "2026-06-26T05:30:00",
      "closedAt": "2026-06-26T12:00:00",
      "workedMinutes": 390,
      "workedHours": 6.5,
      "totalRevenue": 850000,
      "status": "CLOSED",
      "openingNote": "Ca sáng",
      "closingNote": "Đóng ca đủ tiền",
      "attendanceNote": null
    }
  ]
}
```

---

## 4.3. Current Employee Attendance API

### GET /attendance/me

Cho nhân viên xem giờ làm của chính mình nếu muốn.

Query:

```text
?fromDate=2026-06-01&toDate=2026-06-30
```

Cái này không bắt buộc. Nếu chưa cần, bỏ.

---

## 4.4. Update Attendance Note API

### PATCH /attendance/shifts/{shiftId}/note

Chủ cửa hàng cập nhật ghi chú chấm công.

Body:

```json
{
  "attendanceNote": "Ca này nhân viên đóng muộn do đông khách"
}
```

Chỉ OWNER được dùng.

---

## 4.5. Adjust Worked Time API

Cái này để sau, chưa nên làm vội.

### PATCH /attendance/shifts/{shiftId}/adjust-worked-time

Dùng khi nhân viên quên đóng ca hoặc mở ca sai.

Body:

```json
{
  "openedAt": "2026-06-26T05:30:00",
  "closedAt": "2026-06-26T12:00:00",
  "reason": "Nhân viên quên đóng ca đúng giờ"
}
```

Backend tính lại:

```text
worked_minutes = closed_at - opened_at
```

Cần ghi log.

Chỉ OWNER được sửa.

---

# 5. Logic backend

## Khi đóng ca

Trong service đóng ca:

```text
closeShift(shiftId, request)
```

Sau khi validate tiền và vật tư, thêm logic:

```text
closed_at = now()
worked_minutes = minutes_between(opened_at, closed_at)
status = CLOSED
```

Pseudo-code:

```java
LocalDateTime openedAt = shift.getOpenedAt();
LocalDateTime closedAt = LocalDateTime.now();

long workedMinutes = Duration.between(openedAt, closedAt).toMinutes();

shift.setClosedAt(closedAt);
shift.setWorkedMinutes((int) workedMinutes);
shift.setStatus(ShiftStatus.CLOSED);
```

Cần validate:

```text
closed_at phải lớn hơn opened_at
worked_minutes > 0
shift phải đang OPEN
```

---

## Khi lấy tổng hợp chấm công

Query chỉ lấy ca đã đóng:

```sql
SELECT
  user_id,
  COUNT(*) AS total_shifts,
  SUM(worked_minutes) AS total_worked_minutes,
  AVG(worked_minutes) AS avg_worked_minutes
FROM shifts
WHERE status = 'CLOSED'
  AND opened_at >= :fromDate
  AND opened_at < :toDate
GROUP BY user_id;
```

Không nên tính bằng giờ dạng số thực trong DB. Nên lưu bằng phút để tránh lỗi lẻ.

Frontend hiển thị:

```text
390 phút → 6 giờ 30 phút
```

hoặc:

```text
390 phút → 6.5 giờ
```

---

# 6. Frontend cần thêm

## 6.1. Route

Thêm routes:

```text
/admin/attendance
/admin/attendance/$userId
```

Nếu dùng TanStack Router:

```text
src/routes/admin/attendance.tsx
src/routes/admin/attendance.$userId.tsx
```

---

## 6.2. Feature folder

Thêm folder:

```text
src/features/attendance
```

Cấu trúc:

```text
features/attendance
├── api
│   └── attendanceApi.ts
├── components
│   ├── AttendanceSummaryCards.tsx
│   ├── AttendanceEmployeeTable.tsx
│   ├── AttendanceShiftTable.tsx
│   └── AttendanceDateFilter.tsx
├── pages
│   ├── AttendancePage.tsx
│   └── AttendanceDetailPage.tsx
├── hooks
│   ├── useAttendanceSummary.ts
│   └── useEmployeeAttendance.ts
└── types
    └── attendance.type.ts
```

---

## 6.3. Trang /admin/attendance

Gồm:

```text
Header: Chấm công nhân viên
Filter: tháng này / từ ngày - đến ngày
Summary cards
Bảng nhân viên
```

Summary cards:

```text
Tổng giờ làm
Tổng số ca
Số nhân viên
Nhân viên làm nhiều nhất
```

Bảng:

| Nhân viên | Số ca | Tổng giờ | Trung bình/ca | Ca gần nhất | Thao tác |
| --------- | ----: | -------: | ------------: | ----------- | -------- |

Khi bấm `Xem chi tiết`, điều hướng sang:

```text
/admin/attendance/:userId
```

---

## 6.4. Trang /admin/attendance/:userId

Gồm:

```text
Thông tin nhân viên
Tổng giờ trong kỳ
Danh sách ca đã làm
```

Bảng chi tiết:

| Ngày | Mở ca | Đóng ca | Số giờ | Doanh thu | Ghi chú |
| ---- | ----- | ------- | -----: | --------: | ------- |

Nên có nút quay lại:

```text
← Quay lại chấm công
```

---

# 7. Format hiển thị giờ làm

Không nên chỉ hiển thị `6.5`. Với người dùng thật, nên hiển thị:

```text
6 giờ 30 phút
```

Tạo hàm util:

```ts
export function formatWorkedMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours === 0) {
    return `${remainingMinutes} phút`
  }

  if (remainingMinutes === 0) {
    return `${hours} giờ`
  }

  return `${hours} giờ ${remainingMinutes} phút`
}
```

Ví dụ:

```text
390 → 6 giờ 30 phút
480 → 8 giờ
45 → 45 phút
```

---

# 8. Sidebar cần thêm menu

Thêm menu trong nhóm Quản lý:

```text
Chấm công
```

Icon gợi ý:

```text
Clock
CalendarClock
Timer
```

Đường dẫn:

```text
/admin/attendance
```

---

# 9. Quy tắc nghiệp vụ cần nhớ

## Rule 1: Chỉ ca đã đóng mới tính công

```text
status = CLOSED
```

Ca đang mở không tính vào tổng.

---

## Rule 2: Giờ làm lấy từ mở ca và đóng ca

```text
worked_minutes = closed_at - opened_at
```

Không cho nhân viên tự nhập giờ làm.

---

## Rule 3: Nhân viên không được sửa giờ làm

Chỉ OWNER được điều chỉnh nếu có lỗi.

---

## Rule 4: Nếu ca quên đóng

Nếu nhân viên quên đóng ca, ca đó vẫn `OPEN`, không tính công cho đến khi được đóng.

Có thể có cảnh báo:

```text
Có ca chưa đóng
```

Chủ cửa hàng có thể xử lý thủ công.

---

## Rule 5: Không tính ca bị hủy

Nếu sau này có trạng thái ca đặc biệt như `CANCELLED`, không tính vào chấm công.

MVP chỉ cần:

```text
OPEN
CLOSED
```

---

# 10. Có cần thay đổi bảng users không?

MVP: không cần.

Nếu muốn tính lương thì thêm:

```text
hourly_wage
```

Vào bảng `users`.

Ví dụ:

| Field       | Type          | Ghi chú        |
| ----------- | ------------- | -------------- |
| hourly_wage | DECIMAL(12,2) | Lương theo giờ |

Nhưng phần lương nên để sau, vì lúc đầu chỉ cần tổng giờ làm.

---

# 11. API MVP nên làm trước

Thứ tự nên code:

```text
1. Bổ sung worked_minutes vào shifts
2. Khi đóng ca thì tự tính worked_minutes
3. GET /attendance/summary
4. GET /attendance/users/{userId}
5. Tạo trang /admin/attendance
6. Tạo trang /admin/attendance/:userId
7. Thêm menu Chấm công vào sidebar
```

Chưa cần làm ngay:

```text
- Tính lương
- Export Excel
- Điều chỉnh giờ làm
- Nhân viên tự xem công của mình
```

---

# 12. Chốt thiết kế

Với hệ thống hiện tại, chấm công nên dựa trực tiếp trên bảng `shifts`.

Không cần tạo hệ thống check-in/check-out riêng.

Thiết kế hợp lý nhất:

```text
Mở ca = bắt đầu làm
Đóng ca = kết thúc làm
Số giờ làm = Đóng ca - Mở ca
```

Trang cần có:

```text
/admin/attendance
→ Tổng hợp số giờ làm theo từng nhân viên

/admin/attendance/:userId
→ Chi tiết các ca làm của nhân viên đó
```

Database chỉ cần bổ sung:

```text
shifts.worked_minutes
shifts.attendance_note
```

Sau này nếu cần tính lương thì thêm:

```text
users.hourly_wage
```
