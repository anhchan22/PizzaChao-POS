package com.example.pizzachaongon.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderItemResponse {
    private Long id;
    private Long productId;
    private String productName;
    private Long sizeId;
    private String sizeName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private String note;
    private List<OrderItemOptionResponse> options;
}
