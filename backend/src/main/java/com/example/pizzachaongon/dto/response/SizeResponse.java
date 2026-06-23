package com.example.pizzachaongon.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SizeResponse {
    private Long id;
    private String name;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
