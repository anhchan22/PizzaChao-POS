package com.example.pizzachaongon.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SizeRequest {
    @NotBlank(message = "Size name is required")
    private String name;
    private String description;
}
