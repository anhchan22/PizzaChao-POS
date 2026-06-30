package com.example.pizzachaongon.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class TopProductResponse {
    private String productName;
    private Long quantitySold;
    private BigDecimal revenue;
}
