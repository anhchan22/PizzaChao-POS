package com.example.pizzachaongon.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class DashboardResponse {
    private BigDecimal todayRevenue;
    private Long todayOrders;
    private BigDecimal cashRevenue;
    private BigDecimal transferRevenue;
    private Long cashCount;
    private Long transferCount;
    private BigDecimal todayExpenses;
    private BigDecimal estimatedProfit;
    private List<TopProductResponse> topProducts;
    private List<LowStockItemResponse> lowStockItems;
}
