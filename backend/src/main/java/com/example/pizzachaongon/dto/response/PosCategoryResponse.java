package com.example.pizzachaongon.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class PosCategoryResponse {
    private Long id;
    private String name;
    private Integer sortOrder;
    private List<PosProductResponse> products;
}
