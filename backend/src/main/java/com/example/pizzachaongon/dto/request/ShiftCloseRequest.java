package com.example.pizzachaongon.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ShiftCloseRequest {
    @NotNull(message = "Actual cash is required")
    private Double actualCash;
    private String note;
}
