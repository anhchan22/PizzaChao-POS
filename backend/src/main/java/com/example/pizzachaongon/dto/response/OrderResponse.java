package com.example.pizzachaongon.dto.response;

import com.example.pizzachaongon.enums.OrderStatus;
import com.example.pizzachaongon.enums.PaymentMethod;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderResponse {
    private Long id;
    private String orderCode;
    private String customerName;
    private String customerPhone;
    private OrderStatus status;
    private PaymentMethod paymentMethod;
    private BigDecimal totalAmount;
    private String note;
    private String cancelReason;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;
    private Integer queueNumber;
    private List<OrderItemResponse> items;
}
