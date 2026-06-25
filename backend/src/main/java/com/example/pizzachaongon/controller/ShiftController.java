package com.example.pizzachaongon.controller;

import com.example.pizzachaongon.dto.request.ShiftCloseRequest;
import com.example.pizzachaongon.dto.request.ShiftOpenRequest;
import com.example.pizzachaongon.dto.response.ApiResponse;
import com.example.pizzachaongon.dto.response.ShiftResponse;
import com.example.pizzachaongon.enums.ShiftStatus;
import com.example.pizzachaongon.service.ShiftService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/shifts")
@RequiredArgsConstructor
public class ShiftController {
    private final ShiftService shiftService;

    @GetMapping("/current")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ApiResponse<ShiftResponse> getCurrentShift() {
        return ApiResponse.success(shiftService.getCurrentShift());
    }

    @PostMapping("/open")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ApiResponse<ShiftResponse> openShift(@Valid @RequestBody ShiftOpenRequest request) {
        return ApiResponse.success("Mở ca thành công", shiftService.openShift(request));
    }

    @PostMapping("/close")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ApiResponse<ShiftResponse> closeShift(@Valid @RequestBody ShiftCloseRequest request) {
        return ApiResponse.success("Đóng ca thành công", shiftService.closeShift(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<Page<ShiftResponse>> getHistory(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) ShiftStatus status,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        int safeSize = Math.min(Math.max(size, 1), 100);
        PageRequest pageable = PageRequest.of(
                Math.max(page, 0),
                safeSize,
                Sort.by(Sort.Direction.DESC, "openedAt")
        );
        return ApiResponse.success(
                shiftService.getHistory(userId, status, fromDate, toDate, pageable)
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<ShiftResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(shiftService.getById(id));
    }
}
