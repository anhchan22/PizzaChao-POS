package com.example.pizzachaongon.dto.response;

import com.example.pizzachaongon.enums.ExpenseType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class ExpenseResponse {
    private Long id;
    private ExpenseType type;
    private String title;
    private BigDecimal amount;
    private LocalDateTime incurredAt;
    private Long shiftId;
    private String shiftLabel;
    private Long createdById;
    private String createdByName;
    private String receiptImageUrl;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
