package com.example.pizzachaongon.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductVariantResponse {
    private Long id;
    private SizeResponse size;
    private BigDecimal price;
}
