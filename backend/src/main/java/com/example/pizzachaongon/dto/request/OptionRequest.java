package com.example.pizzachaongon.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class OptionRequest {
    @NotBlank(message = "Option name is required")
    private String name;
    
    @NotNull(message = "Option price is required")
    private BigDecimal price;
    
    private Boolean isActive;
}
