package com.example.pizzachaongon.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class OrderItemRequest {
    
    @NotNull(message = "ID sản phẩm không được để trống")
    private Long productId;
    
    @NotNull(message = "ID kích cỡ không được để trống")
    private Long sizeId;
    
    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer quantity;
    
    private String note;
    
    private List<Long> optionIds;
}
