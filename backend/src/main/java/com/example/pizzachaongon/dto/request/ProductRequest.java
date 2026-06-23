package com.example.pizzachaongon.dto.request;

import com.example.pizzachaongon.enums.ProductStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ProductRequest {
    @NotNull(message = "Category ID is required")
    private Long categoryId;

    @NotBlank(message = "Product name is required")
    private String name;

    private String description;
    private String imageUrl;
    private ProductStatus status;

    @NotNull(message = "Base price is required")
    private BigDecimal basePrice;

    private List<VariantRequest> variants;

    @Data
    public static class VariantRequest {
        @NotNull(message = "Size ID is required")
        private Long sizeId;

        @NotNull(message = "Price is required")
        private BigDecimal price;
    }
}
