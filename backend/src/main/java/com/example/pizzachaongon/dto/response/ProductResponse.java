package com.example.pizzachaongon.dto.response;

import com.example.pizzachaongon.enums.ProductStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ProductResponse {
    private Long id;
    private ProductCategoryResponse category;
    private String name;
    private String description;
    private String imageUrl;
    private ProductStatus status;
    private BigDecimal basePrice;
    private Long soldQuantity;
    private List<ProductVariantResponse> variants;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
