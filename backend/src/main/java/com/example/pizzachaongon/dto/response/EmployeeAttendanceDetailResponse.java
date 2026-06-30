package com.example.pizzachaongon.dto.response;

import com.example.pizzachaongon.enums.ShiftStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class EmployeeAttendanceDetailResponse {
    private AttendanceUser user;
    private AttendanceTotals summary;
    private List<AttendanceShift> shifts;

    @Data
    @Builder
    public static class AttendanceUser {
        private Long id;
        private String fullName;
        private String phone;
    }

    @Data
    @Builder
    public static class AttendanceTotals {
        private long totalShifts;
        private long totalWorkedMinutes;
        private double totalWorkedHours;
        private double averageHoursPerShift;
    }

    @Data
    @Builder
    public static class AttendanceShift {
        private Long shiftId;
        private LocalDate workDate;
        private LocalDateTime openedAt;
        private LocalDateTime closedAt;
        private Integer workedMinutes;
        private double workedHours;
        private BigDecimal totalRevenue;
        private ShiftStatus status;
        private String openingNote;
        private String closingNote;
        private String attendanceNote;
    }
}
