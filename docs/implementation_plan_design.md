# Đồng bộ giao diện các trang quản lý

Tiến hành áp dụng cấu trúc giao diện "Mép rìa trắng - Nền xanh bao phủ - Các khối card trắng nổi lên" (đã áp dụng cho trang Đơn hàng và POS) cho toàn bộ các trang quản lý còn lại trong hệ thống.

## Đề xuất thay đổi

Tất cả các file Page dưới đây sẽ được bao bọc bởi cấu trúc nền xanh `#d2f2e7` (`bg-[#d2f2e7]`) với viền margin bo tròn (`rounded-2xl`).
Bên trong, các khối nội dung (Header, Bảng dữ liệu, Form lọc) sẽ được chuyển thành các thẻ trắng (`bg-white/90`) bo tròn tương tự.

### Danh sách các trang được áp dụng

#### [MODIFY] [AttendanceDetailPage.tsx](file:///D:/AnhTran/VHEC/ChaoPizza/frontend/src/features/attendance/AttendanceDetailPage.tsx)
#### [MODIFY] [AttendancePage.tsx](file:///D:/AnhTran/VHEC/ChaoPizza/frontend/src/features/attendance/AttendancePage.tsx)
#### [MODIFY] [DashboardPage.tsx](file:///D:/AnhTran/VHEC/ChaoPizza/frontend/src/features/dashboard/DashboardPage.tsx)
#### [MODIFY] [ExpenseManagementPage.tsx](file:///D:/AnhTran/VHEC/ChaoPizza/frontend/src/features/expenses/ExpenseManagementPage.tsx)
#### [MODIFY] [InventoryManagementPage.tsx](file:///D:/AnhTran/VHEC/ChaoPizza/frontend/src/features/inventory/InventoryManagementPage.tsx)
#### [MODIFY] [CategoryManagementPage.tsx](file:///D:/AnhTran/VHEC/ChaoPizza/frontend/src/features/products/CategoryManagementPage.tsx)
#### [MODIFY] [OptionManagementPage.tsx](file:///D:/AnhTran/VHEC/ChaoPizza/frontend/src/features/products/OptionManagementPage.tsx)
#### [MODIFY] [ProductManagementPage.tsx](file:///D:/AnhTran/VHEC/ChaoPizza/frontend/src/features/products/ProductManagementPage.tsx)
#### [MODIFY] [SizeManagementPage.tsx](file:///D:/AnhTran/VHEC/ChaoPizza/frontend/src/features/products/SizeManagementPage.tsx)
#### [MODIFY] [SettingsPage.tsx](file:///D:/AnhTran/VHEC/ChaoPizza/frontend/src/features/settings/SettingsPage.tsx)
#### [MODIFY] [ShiftHistoryPage.tsx](file:///D:/AnhTran/VHEC/ChaoPizza/frontend/src/features/shift/ShiftHistoryPage.tsx)
#### [MODIFY] [UserManagementPage.tsx](file:///D:/AnhTran/VHEC/ChaoPizza/frontend/src/features/users/UserManagementPage.tsx)

## User Review Required
Bạn hãy xem qua danh sách các trang trên. Nếu bạn đồng ý, tôi sẽ tự động thay thế giao diện (wrapper bên ngoài màu xanh và các cục trắng bên trong) cho **toàn bộ 12 trang này** để tất cả đồng nhất một giao diện phẳng và đẹp mắt nhất nhé!

## Verification Plan
1. Lần lượt thay thế mã JSX ở component gốc của mỗi Page.
2. Kiểm tra độ ổn định của giao diện (tránh lỗi vỡ layout hoặc báo lỗi thư viện thiếu/thừa đóng tag).
3. Người dùng F5 kiểm tra thực tế.
