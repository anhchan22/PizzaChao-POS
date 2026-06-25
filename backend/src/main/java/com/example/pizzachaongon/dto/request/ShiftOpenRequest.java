package com.example.pizzachaongon.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ShiftOpenRequest {

    @NotNull(message = "Tiền đầu ca không được để trống")
    @DecimalMin(value = "0.00", message = "Tiền đầu ca không được âm")
    @Digits(integer = 10, fraction = 2, message = "Tiền đầu ca không hợp lệ")
    private BigDecimal startingCash;

    @Size(max = 500, message = "Ghi chú đầu ca không được vượt quá 500 ký tự")
    private String openingNote;
}
