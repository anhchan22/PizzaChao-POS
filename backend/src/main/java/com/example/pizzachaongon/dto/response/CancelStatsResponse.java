package com.example.pizzachaongon.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class CancelStatsResponse {
    private Long totalCancelled;
    private BigDecimal totalLostRevenue;
    private List<CancelReasonResponse> topReasons;

    @Data
    @Builder
    public static class CancelReasonResponse {
        private String reason;
        private Long count;
    }
}
