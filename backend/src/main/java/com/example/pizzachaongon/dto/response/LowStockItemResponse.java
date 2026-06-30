package com.example.pizzachaongon.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class LowStockItemResponse {
    private Long id;
    private String name;
    private String unit;
    private BigDecimal currentQuantity;
    private BigDecimal warningQuantity;
}
