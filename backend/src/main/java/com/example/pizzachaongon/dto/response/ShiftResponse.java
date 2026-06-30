package com.example.pizzachaongon.dto.response;

import com.example.pizzachaongon.enums.ShiftStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class ShiftResponse {
    private Long id;
    private Long openedById;
    private String openedByName;
    private String closedByName;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
    private BigDecimal startingCash;
    private BigDecimal expectedCash;
    private BigDecimal actualCash;
    private BigDecimal cashDifference;
    private String openingNote;
    private String closingNote;
    private Integer workedMinutes;
    private String attendanceNote;
    private ShiftStatus status;
}
