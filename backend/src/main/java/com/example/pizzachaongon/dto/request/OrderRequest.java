package com.example.pizzachaongon.dto.request;

import com.example.pizzachaongon.enums.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderRequest {
    private String customerName;
    private String customerPhone;
    
    @NotNull(message = "Phương thức thanh toán không được để trống")
    private PaymentMethod paymentMethod;

    @DecimalMin(value = "0.00", message = "Số tiền khách đưa không được âm")
    private BigDecimal receivedAmount;

    @Size(max = 100, message = "Mã thanh toán không được vượt quá 100 ký tự")
    private String paymentReference;

    private Boolean paymentConfirmed;
    
    private String note;
    
    @NotEmpty(message = "Đơn hàng phải có ít nhất 1 sản phẩm")
    @Valid
    private List<OrderItemRequest> items;
}
