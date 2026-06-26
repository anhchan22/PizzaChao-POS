package com.example.pizzachaongon.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class InventoryItemRequest {

    @NotBlank(message = "Tên vật tư không được để trống")
    @Size(max = 120, message = "Tên vật tư không được vượt quá 120 ký tự")
    private String name;

    @NotBlank(message = "Đơn vị tính không được để trống")
    @Size(max = 30, message = "Đơn vị tính không được vượt quá 30 ký tự")
    private String unit;

    @NotNull(message = "Số lượng hiện tại không được để trống")
    @DecimalMin(value = "0.00", message = "Số lượng hiện tại không được âm")
    @Digits(integer = 10, fraction = 2, message = "Số lượng hiện tại không hợp lệ")
    private BigDecimal currentQuantity;

    @NotNull(message = "Ngưỡng cảnh báo không được để trống")
    @DecimalMin(value = "0.00", message = "Ngưỡng cảnh báo không được âm")
    @Digits(integer = 10, fraction = 2, message = "Ngưỡng cảnh báo không hợp lệ")
    private BigDecimal warningQuantity;

    private Boolean active = true;

    @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    private String note;

    @Valid
    private List<InventoryUsageRuleRequest> usageRules = new ArrayList<>();
}
