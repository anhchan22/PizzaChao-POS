package com.example.pizzachaongon.controller;

import com.example.pizzachaongon.dto.response.ApiResponse;
import com.example.pizzachaongon.dto.request.ShiftCloseRequest;
import com.example.pizzachaongon.dto.request.ShiftOpenRequest;
import com.example.pizzachaongon.dto.response.ShiftResponse;
import com.example.pizzachaongon.service.ShiftService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/shifts")
@RequiredArgsConstructor
public class ShiftController {
    private final ShiftService shiftService;

    @GetMapping("/current")
    public ApiResponse<ShiftResponse> getCurrentShift() {
        return ApiResponse.success(shiftService.getCurrentShift());
    }

    @PostMapping("/open")
    public ApiResponse<ShiftResponse> openShift(@Valid @RequestBody ShiftOpenRequest request) {
        return ApiResponse.success("Mở ca thành công", shiftService.openShift(request));
    }

    @PostMapping("/close")
    public ApiResponse<ShiftResponse> closeShift(@Valid @RequestBody ShiftCloseRequest request) {
        return ApiResponse.success("Đóng ca thành công", shiftService.closeShift(request));
    }
}
