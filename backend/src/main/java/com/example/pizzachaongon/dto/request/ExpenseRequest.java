package com.example.pizzachaongon.dto.request;

import com.example.pizzachaongon.enums.ExpenseType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ExpenseRequest {

    @NotNull(message = "Loại chi phí không được để trống")
    private ExpenseType type;

    @NotBlank(message = "Tên khoản chi không được để trống")
    @Size(max = 150, message = "Tên khoản chi không được vượt quá 150 ký tự")
    private String title;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền phải lớn hơn 0")
    @Digits(integer = 10, fraction = 2, message = "Số tiền không hợp lệ")
    private BigDecimal amount;

    private LocalDateTime incurredAt;

    private boolean attachToCurrentShift;

    @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    private String note;

    @Size(max = 500, message = "URL ảnh hóa đơn không được vượt quá 500 ký tự")
    private String receiptImageUrl;
}
