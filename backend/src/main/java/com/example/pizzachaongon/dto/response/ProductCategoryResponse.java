package com.example.pizzachaongon.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ProductCategoryResponse {
    private Long id;
    private String name;
    private String description;
    private Integer sortOrder;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
