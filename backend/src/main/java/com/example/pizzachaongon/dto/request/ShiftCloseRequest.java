package com.example.pizzachaongon.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;
import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class ShiftCloseRequest {

    @NotNull(message = "Tiền cuối ca không được để trống")
    @DecimalMin(value = "0.00", message = "Tiền cuối ca không được âm")
    @Digits(integer = 10, fraction = 2, message = "Tiền cuối ca không hợp lệ")
    private BigDecimal actualCash;

    @Size(max = 500, message = "Ghi chú đóng ca không được vượt quá 500 ký tự")
    private String closingNote;

    @Valid
    private List<ShiftInventoryStocktakeRequest> inventoryCounts = new ArrayList<>();
}
