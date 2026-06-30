package com.example.pizzachaongon.controller;

import com.example.pizzachaongon.dto.request.AttendanceNoteRequest;
import com.example.pizzachaongon.dto.response.ApiResponse;
import com.example.pizzachaongon.dto.response.AttendanceSummaryResponse;
import com.example.pizzachaongon.dto.response.EmployeeAttendanceDetailResponse;
import com.example.pizzachaongon.enums.ShiftStatus;
import com.example.pizzachaongon.service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
public class AttendanceController {
    private final AttendanceService attendanceService;

    @GetMapping("/summary")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<AttendanceSummaryResponse> getSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) ShiftStatus status
    ) {
        return ApiResponse.success(attendanceService.getSummary(fromDate, toDate, userId, status));
    }

    @GetMapping("/users/{userId}")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<EmployeeAttendanceDetailResponse> getEmployeeDetail(
            @PathVariable Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) ShiftStatus status
    ) {
        return ApiResponse.success(attendanceService.getEmployeeDetail(userId, fromDate, toDate, status));
    }

    @PatchMapping("/shifts/{shiftId}/note")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<Void> updateAttendanceNote(
            @PathVariable Long shiftId,
            @Valid @RequestBody AttendanceNoteRequest request
    ) {
        attendanceService.updateAttendanceNote(shiftId, request);
        return ApiResponse.success("Đã cập nhật ghi chú chấm công", null);
    }
}
