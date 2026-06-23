package com.example.pizzachaongon.controller;

import com.example.pizzachaongon.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/upload")
@RequiredArgsConstructor
public class UploadController {

    private final FileStorageService fileStorageService;

    @PostMapping("/image")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        String fileName = fileStorageService.storeFile(file);
        Map<String, String> response = new HashMap<>();
        response.put("url", fileName);
        return ResponseEntity.ok(response);
    }
}
