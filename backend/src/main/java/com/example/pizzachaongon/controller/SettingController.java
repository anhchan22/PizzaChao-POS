package com.example.pizzachaongon.controller;

import com.example.pizzachaongon.dto.response.ApiResponse;
import com.example.pizzachaongon.dto.SettingDto;
import com.example.pizzachaongon.service.SettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class SettingController {
    private final SettingService settingService;

    @GetMapping
    public ApiResponse<List<SettingDto>> getAllSettings() {
        return ApiResponse.success(settingService.getAllSettings());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_OWNER')")
    public ApiResponse<Void> saveSettings(@RequestBody List<SettingDto> settings) {
        settingService.saveSettings(settings);
        return ApiResponse.success("Settings updated successfully", null);
    }
}
