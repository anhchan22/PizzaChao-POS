package com.example.pizzachaongon.controller;

import com.example.pizzachaongon.dto.response.ApiResponse;
import com.example.pizzachaongon.dto.request.OptionRequest;
import com.example.pizzachaongon.dto.response.ProductOptionResponse;
import com.example.pizzachaongon.service.ProductOptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/options")
@RequiredArgsConstructor
public class ProductOptionController {

    private final ProductOptionService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ApiResponse<List<ProductOptionResponse>> getAllOptions() {
        return ApiResponse.success(service.getAllOptions());
    }

    @GetMapping("/pos")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ApiResponse<List<ProductOptionResponse>> getPosOptions() {
        // Lọc ra các option đang active
        List<ProductOptionResponse> activeOptions = service.getAllOptions().stream()
                .filter(ProductOptionResponse::getIsActive)
                .collect(Collectors.toList());
        return ApiResponse.success(activeOptions);
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<ProductOptionResponse> createOption(@Valid @RequestBody OptionRequest request) {
        return ApiResponse.success(service.createOption(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<ProductOptionResponse> updateOption(@PathVariable Long id, @Valid @RequestBody OptionRequest request) {
        return ApiResponse.success(service.updateOption(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<Void> deleteOption(@PathVariable Long id) {
        service.deleteOption(id);
        return ApiResponse.success(null);
    }
}
