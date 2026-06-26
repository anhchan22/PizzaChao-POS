package com.example.pizzachaongon.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class InventoryItemResponse {
    private Long id;
    private String name;
    private String unit;
    private BigDecimal currentQuantity;
    private BigDecimal warningQuantity;
    private BigDecimal estimatedUsed;
    private BigDecimal estimatedRemaining;
    private boolean lowStock;
    private LocalDateTime lastStocktakeAt;
    private boolean active;
    private String note;
    private List<InventoryUsageRuleResponse> usageRules;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
