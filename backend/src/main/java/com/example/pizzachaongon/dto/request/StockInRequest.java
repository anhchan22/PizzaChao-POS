package com.example.pizzachaongon.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class StockInRequest {
    @NotNull(message = "Số lượng nhập không được để trống")
    @DecimalMin(value = "0.01", message = "Số lượng nhập phải lớn hơn 0")
    @Digits(integer = 10, fraction = 2, message = "Số lượng nhập không hợp lệ")
    private BigDecimal quantity;

    @Size(max = 500, message = "Ghi chú nhập hàng không được vượt quá 500 ký tự")
    private String note;
}
