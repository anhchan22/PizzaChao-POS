package com.example.pizzachaongon.dto.response;

import com.example.pizzachaongon.enums.ShiftStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ShiftResponse {
    private Long id;
    private String openedByName;
    private String closedByName;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
    private Double startingCash;
    private Double expectedCash;
    private Double actualCash;
    private String note;
    private ShiftStatus status;
}
