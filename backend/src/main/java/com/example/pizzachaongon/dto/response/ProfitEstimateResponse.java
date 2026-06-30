package com.example.pizzachaongon.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ProfitEstimateResponse {
    private BigDecimal revenue;
    private BigDecimal expenses;
    private List<ExpenseByTypeResponse> expensesByType;
    private BigDecimal profit;
    private Double profitMarginPercent;

    @Data
    @Builder
    public static class ExpenseByTypeResponse {
        private String type;
        private BigDecimal amount;
    }
}
