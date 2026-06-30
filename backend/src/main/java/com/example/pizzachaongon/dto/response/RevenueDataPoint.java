package com.example.pizzachaongon.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class RevenueDataPoint {
    private String label; // date string or week/month label
    private BigDecimal revenue;
    private Long orderCount;
}
