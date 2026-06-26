package com.example.pizzachaongon.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class InventoryUsageRuleResponse {
    private Long id;
    private Long sizeId;
    private String sizeName;
    private BigDecimal quantityPerOrder;
}
