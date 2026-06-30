package com.example.pizzachaongon.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class PaymentMethodStats {
    private BigDecimal cashRevenue;
    private BigDecimal transferRevenue;
    private Long cashCount;
    private Long transferCount;
}
