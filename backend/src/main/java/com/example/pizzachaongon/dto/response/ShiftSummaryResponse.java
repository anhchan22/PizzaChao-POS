package com.example.pizzachaongon.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class ShiftSummaryResponse {
    private Long shiftId;
    private String staffName;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
    private BigDecimal revenue;
    private Long orderCount;
    private BigDecimal cashDifference;
}
