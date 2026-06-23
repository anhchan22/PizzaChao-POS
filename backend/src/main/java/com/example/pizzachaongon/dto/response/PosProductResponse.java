package com.example.pizzachaongon.dto.response;

import com.example.pizzachaongon.enums.ProductStatus;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class PosProductResponse {
    private Long id;
    private String name;
    private String description;
    private String imageUrl;
    private ProductStatus status;
    private BigDecimal basePrice;
    private List<ProductVariantResponse> variants;
}
