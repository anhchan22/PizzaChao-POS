package com.example.pizzachaongon.controller;

import com.example.pizzachaongon.dto.request.InventoryItemRequest;
import com.example.pizzachaongon.dto.request.StockInRequest;
import com.example.pizzachaongon.dto.response.ApiResponse;
import com.example.pizzachaongon.dto.response.InventoryItemResponse;
import com.example.pizzachaongon.dto.response.StockMovementResponse;
import com.example.pizzachaongon.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory-items")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryService inventoryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ApiResponse<List<InventoryItemResponse>> getAll(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String keyword
    ) {
        return ApiResponse.success(inventoryService.getAll(active, keyword));
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ApiResponse<List<InventoryItemResponse>> getLowStock() {
        return ApiResponse.success(inventoryService.getLowStock());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ApiResponse<InventoryItemResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(inventoryService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<InventoryItemResponse> create(@Valid @RequestBody InventoryItemRequest request) {
        return ApiResponse.success("Đã tạo vật tư", inventoryService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<InventoryItemResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody InventoryItemRequest request
    ) {
        return ApiResponse.success("Đã cập nhật vật tư", inventoryService.update(id, request));
    }

    @PostMapping("/{id}/stock-in")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ApiResponse<InventoryItemResponse> stockIn(
            @PathVariable Long id,
            @Valid @RequestBody StockInRequest request
    ) {
        return ApiResponse.success("Đã nhập hàng vào kho", inventoryService.stockIn(id, request));
    }

    @GetMapping("/{id}/movements")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ApiResponse<List<StockMovementResponse>> getMovements(@PathVariable Long id) {
        return ApiResponse.success(inventoryService.getMovements(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        inventoryService.delete(id);
        return ApiResponse.success("Đã xóa vật tư", null);
    }
}
