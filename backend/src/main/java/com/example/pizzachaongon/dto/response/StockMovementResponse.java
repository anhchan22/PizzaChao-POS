package com.example.pizzachaongon.dto.response;

import com.example.pizzachaongon.enums.StockMovementType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class StockMovementResponse {
    private Long id;
    private Long inventoryItemId;
    private String inventoryItemName;
    private Long shiftId;
    private StockMovementType type;
    private BigDecimal quantityChange;
    private BigDecimal beforeQuantity;
    private BigDecimal afterQuantity;
    private String note;
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;
}
