package com.example.pizzachaongon.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ShiftOpenRequest {
    @NotNull(message = "Starting cash is required")
    private Double startingCash;
}
