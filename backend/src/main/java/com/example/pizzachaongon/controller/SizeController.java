package com.example.pizzachaongon.controller;

import com.example.pizzachaongon.dto.request.SizeRequest;
import com.example.pizzachaongon.dto.response.SizeResponse;
import com.example.pizzachaongon.service.SizeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sizes")
@RequiredArgsConstructor
public class SizeController {

    private final SizeService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<List<SizeResponse>> getAllSizes() {
        return ResponseEntity.ok(service.getAllSizes());
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<SizeResponse> createSize(@Valid @RequestBody SizeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createSize(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<SizeResponse> updateSize(@PathVariable Long id, @Valid @RequestBody SizeRequest request) {
        return ResponseEntity.ok(service.updateSize(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> deleteSize(@PathVariable Long id) {
        service.deleteSize(id);
        return ResponseEntity.noContent().build();
    }
}
