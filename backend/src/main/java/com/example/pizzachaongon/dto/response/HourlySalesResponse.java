package com.example.pizzachaongon.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class HourlySalesResponse {
    private Integer hour;
    private Long orderCount;
    private BigDecimal revenue;
}
