package com.example.pizzachaongon.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AttendanceSummaryResponse {
    private LocalDate fromDate;
    private LocalDate toDate;
    private long totalEmployees;
    private long totalShifts;
    private long totalWorkedMinutes;
    private EmployeeAttendanceSummary topEmployee;
    private List<EmployeeAttendanceSummary> employees;

    @Data
    @Builder
    public static class EmployeeAttendanceSummary {
        private Long userId;
        private String fullName;
        private String phone;
        private long totalShifts;
        private long totalWorkedMinutes;
        private double totalWorkedHours;
        private double averageHoursPerShift;
        private LocalDateTime lastShiftAt;
    }
}
