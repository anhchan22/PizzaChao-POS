package com.example.pizzachaongon.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ShiftInventoryStocktakeRequest {
    @NotNull(message = "Vật tư không được để trống")
    private Long inventoryItemId;

    @NotNull(message = "Số lượng thực tế không được để trống")
    @DecimalMin(value = "0.00", message = "Số lượng thực tế không được âm")
    @Digits(integer = 10, fraction = 2, message = "Số lượng thực tế không hợp lệ")
    private BigDecimal actualQuantity;

    @Size(max = 500, message = "Ghi chú kiểm vật tư không được vượt quá 500 ký tự")
    private String note;
}
