package com.example.pizzachaongon.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class InventoryUsageRuleRequest {
    @NotNull(message = "Size không được để trống")
    private Long sizeId;

    @NotNull(message = "Số lượng dùng mỗi đơn không được để trống")
    @DecimalMin(value = "0.01", message = "Số lượng dùng mỗi đơn phải lớn hơn 0")
    @Digits(integer = 10, fraction = 2, message = "Số lượng dùng mỗi đơn không hợp lệ")
    private BigDecimal quantityPerOrder;
}
