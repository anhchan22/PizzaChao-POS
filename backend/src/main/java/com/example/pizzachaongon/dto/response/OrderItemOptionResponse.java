package com.example.pizzachaongon.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class OrderItemOptionResponse {
    private Long id;
    private Long optionId;
    private String optionName;
    private BigDecimal price;
}
