package com.example.pizzachaongon.service;

import com.example.pizzachaongon.dto.response.*;
import com.example.pizzachaongon.entity.InventoryItem;
import com.example.pizzachaongon.enums.ExpenseType;
import com.example.pizzachaongon.enums.PaymentMethod;
import com.example.pizzachaongon.repository.ExpenseRepository;
import com.example.pizzachaongon.repository.InventoryItemRepository;
import com.example.pizzachaongon.repository.OrderRepository;
import com.example.pizzachaongon.repository.ShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final OrderRepository orderRepository;
    private final ExpenseRepository expenseRepository;
    private final ShiftRepository shiftRepository;
    private final InventoryItemRepository inventoryItemRepository;

    public DashboardResponse getDashboard(LocalDate date) {
        return getDashboard(date.atStartOfDay(), date.plusDays(1).atStartOfDay());
    }

    public DashboardResponse getDashboardByShift(Long shiftId) {
        BigDecimal revenue = orderRepository.sumRevenueByShiftId(shiftId);
        Long orderCount = orderRepository.countPaidByShiftId(shiftId);
        BigDecimal expenses = expenseRepository.sumExpensesByShiftId(shiftId);
        return buildDashboardResponse(
                revenue,
                orderCount,
                orderRepository.revenueByPaymentMethodAndShiftId(shiftId),
                expenses,
                orderRepository.topProductsByShiftId(shiftId)
        );
    }

    public DashboardResponse getDashboard(LocalDateTime from, LocalDateTime to) {
        BigDecimal todayRevenue = orderRepository.sumRevenue(from, to);
        Long todayOrders = orderRepository.countCompleted(from, to);
        BigDecimal todayExpenses = expenseRepository.sumExpenses(from, to);

        return buildDashboardResponse(
                todayRevenue,
                todayOrders,
                orderRepository.revenueByPaymentMethod(from, to),
                todayExpenses,
                orderRepository.topProducts(from, to)
        );
    }

    private DashboardResponse buildDashboardResponse(
            BigDecimal revenue,
            Long orderCount,
            List<Object[]> paymentStats,
            BigDecimal expenses,
            List<Object[]> topProductsRaw
    ) {
        BigDecimal cashRev = BigDecimal.ZERO;
        BigDecimal transRev = BigDecimal.ZERO;
        Long cashCount = 0L;
        Long transCount = 0L;

        for (Object[] row : paymentStats) {
            PaymentMethod method = (PaymentMethod) row[0];
            BigDecimal rev = (BigDecimal) row[1];
            Long cnt = (Long) row[2];
            if (method == PaymentMethod.CASH) {
                cashRev = rev;
                cashCount = cnt;
            } else if (method == PaymentMethod.TRANSFER) {
                transRev = rev;
                transCount = cnt;
            }
        }

        BigDecimal profit = revenue.subtract(expenses);

        List<TopProductResponse> topProducts = topProductsRaw.stream()
                .limit(5)
                .map(row -> TopProductResponse.builder()
                        .productName((String) row[0])
                        .quantitySold(((Number) row[1]).longValue())
                        .revenue((BigDecimal) row[2])
                        .build())
                .collect(Collectors.toList());

        List<InventoryItem> lowStocksRaw = inventoryItemRepository.findLowStock();
        List<LowStockItemResponse> lowStockItems = lowStocksRaw.stream()
                .map(item -> LowStockItemResponse.builder()
                        .id(item.getId())
                        .name(item.getName())
                        .unit(item.getUnit())
                        .currentQuantity(item.getCurrentQuantity())
                        .warningQuantity(item.getWarningQuantity())
                        .build())
                .collect(Collectors.toList());

        return DashboardResponse.builder()
                .todayRevenue(revenue)
                .todayOrders(orderCount)
                .cashRevenue(cashRev)
                .transferRevenue(transRev)
                .cashCount(cashCount)
                .transferCount(transCount)
                .todayExpenses(expenses)
                .estimatedProfit(profit)
                .topProducts(topProducts)
                .lowStockItems(lowStockItems)
                .build();
    }

    public List<RevenueDataPoint> getRevenue(LocalDateTime from, LocalDateTime to, String groupBy) {
        List<Object[]> rawDaily = orderRepository.dailyRevenue(from, to);
        
        if ("DAY".equalsIgnoreCase(groupBy) || groupBy == null) {
            return rawDaily.stream().map(row -> RevenueDataPoint.builder()
                    .label(row[0].toString())
                    .orderCount((Long) row[1])
                    .revenue((BigDecimal) row[2])
                    .build()).collect(Collectors.toList());
        }
        
        // Group by WEEK or MONTH
        Map<String, RevenueDataPoint> grouped = new HashMap<>();
        
        for (Object[] row : rawDaily) {
            LocalDate dt = ((java.sql.Date) row[0]).toLocalDate();
            Long count = (Long) row[1];
            BigDecimal rev = (BigDecimal) row[2];
            
            String label;
            if ("MONTH".equalsIgnoreCase(groupBy)) {
                label = YearMonth.from(dt).toString();
            } else {
                // WEEK - rough grouping by week start (Monday)
                LocalDate weekStart = dt.minusDays(dt.getDayOfWeek().getValue() - 1);
                label = "Tuần " + weekStart.toString();
            }
            
            RevenueDataPoint pt = grouped.getOrDefault(label, RevenueDataPoint.builder()
                    .label(label)
                    .revenue(BigDecimal.ZERO)
                    .orderCount(0L)
                    .build());
            
            pt.setRevenue(pt.getRevenue().add(rev));
            pt.setOrderCount(pt.getOrderCount() + count);
            grouped.put(label, pt);
        }
        
        // Sort grouped points (map values)
        return grouped.values().stream()
                .sorted((a, b) -> a.getLabel().compareTo(b.getLabel()))
                .collect(Collectors.toList());
    }

    public PaymentMethodStats getRevenueByPaymentMethod(LocalDateTime from, LocalDateTime to) {
        List<Object[]> pmtStats = orderRepository.revenueByPaymentMethod(from, to);
        BigDecimal cashRev = BigDecimal.ZERO;
        BigDecimal transRev = BigDecimal.ZERO;
        Long cashCount = 0L;
        Long transCount = 0L;

        for (Object[] row : pmtStats) {
            PaymentMethod method = (PaymentMethod) row[0];
            BigDecimal rev = (BigDecimal) row[1];
            Long cnt = (Long) row[2];
            if (method == PaymentMethod.CASH) {
                cashRev = rev;
                cashCount = cnt;
            } else if (method == PaymentMethod.TRANSFER) {
                transRev = rev;
                transCount = cnt;
            }
        }
        
        return PaymentMethodStats.builder()
                .cashRevenue(cashRev)
                .transferRevenue(transRev)
                .cashCount(cashCount)
                .transferCount(transCount)
                .build();
    }

    public List<TopProductResponse> getTopProducts(LocalDateTime from, LocalDateTime to, Integer limit) {
        List<Object[]> topProductsRaw = orderRepository.topProducts(from, to);
        return topProductsRaw.stream()
                .limit(limit != null ? limit : 10)
                .map(row -> TopProductResponse.builder()
                        .productName((String) row[0])
                        .quantitySold(((Number) row[1]).longValue())
                        .revenue((BigDecimal) row[2])
                        .build())
                .collect(Collectors.toList());
    }

    public List<HourlySalesResponse> getHourlySales(LocalDate date) {
        return getHourlySales(date.atStartOfDay(), date.plusDays(1).atStartOfDay());
    }

    public List<HourlySalesResponse> getHourlySales(LocalDateTime from, LocalDateTime to) {
        List<Object[]> raw = orderRepository.hourlySalesRange(from, to);
        Map<Integer, HourlySalesResponse> map = new HashMap<>();
        
        for (Object[] row : raw) {
            Integer h = ((Number) row[0]).intValue();
            Long count = ((Number) row[1]).longValue();
            BigDecimal rev = (BigDecimal) row[2];
            map.put(h, HourlySalesResponse.builder().hour(h).orderCount(count).revenue(rev).build());
        }
        
        List<HourlySalesResponse> result = new ArrayList<>();
        for (int i = 0; i < 24; i++) {
            result.add(map.getOrDefault(i, HourlySalesResponse.builder().hour(i).orderCount(0L).revenue(BigDecimal.ZERO).build()));
        }
        return result;
    }

    public List<ShiftSummaryResponse> getShiftSummary(LocalDateTime from, LocalDateTime to, Long userId) {
        // Since we don't have a specific native query for shift details joining with revenue directly that fits all filtering perfectly,
        // we will fetch shifts and revenue by shift and combine them.
        List<com.example.pizzachaongon.entity.Shift> shifts = shiftRepository.findHistory(
                userId, null, from, to, org.springframework.data.domain.Pageable.unpaged()
        ).getContent();
        
        List<Object[]> revRaw = orderRepository.revenueByShift(from, to);
        Map<Long, BigDecimal> shiftRevMap = new HashMap<>();
        Map<Long, Long> shiftCountMap = new HashMap<>();
        
        for (Object[] row : revRaw) {
            Long sId = (Long) row[0];
            BigDecimal rev = (BigDecimal) row[1];
            Long cnt = (Long) row[2];
            shiftRevMap.put(sId, rev);
            shiftCountMap.put(sId, cnt);
        }
        
        return shifts.stream().map(s -> ShiftSummaryResponse.builder()
                .shiftId(s.getId())
                .staffName(s.getOpenedBy().getFullName())
                .openedAt(s.getOpenedAt())
                .closedAt(s.getClosedAt())
                .revenue(shiftRevMap.getOrDefault(s.getId(), BigDecimal.ZERO))
                .orderCount(shiftCountMap.getOrDefault(s.getId(), 0L))
                .cashDifference(s.getCashDifference())
                .build()).collect(Collectors.toList());
    }

    public ProfitEstimateResponse getProfitEstimate(LocalDateTime from, LocalDateTime to) {
        BigDecimal rev = orderRepository.sumRevenue(from, to);
        BigDecimal exp = expenseRepository.sumExpenses(from, to);
        List<Object[]> expByTypeRaw = expenseRepository.expensesByType(from, to);
        
        List<ProfitEstimateResponse.ExpenseByTypeResponse> expByType = expByTypeRaw.stream()
                .map(row -> ProfitEstimateResponse.ExpenseByTypeResponse.builder()
                        .type(((ExpenseType) row[0]).name())
                        .amount((BigDecimal) row[1])
                        .build())
                .collect(Collectors.toList());
                
        BigDecimal profit = rev.subtract(exp);
        Double margin = null;
        if (rev.compareTo(BigDecimal.ZERO) > 0) {
            margin = profit.divide(rev, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100")).doubleValue();
        }
        
        return ProfitEstimateResponse.builder()
                .revenue(rev)
                .expenses(exp)
                .expensesByType(expByType)
                .profit(profit)
                .profitMarginPercent(margin)
                .build();
    }

    public CancelStatsResponse getCancelStats(LocalDateTime from, LocalDateTime to) {
        List<Object[]> rawStats = orderRepository.cancelStats(from, to);
        Long count = 0L;
        BigDecimal amount = BigDecimal.ZERO;
        
        if (!rawStats.isEmpty() && rawStats.get(0) != null) {
            Object[] row = rawStats.get(0);
            count = (Long) row[0];
            amount = (BigDecimal) row[1];
        }
        
        List<Object[]> rawReasons = orderRepository.topCancelReasons(from, to);
        List<CancelStatsResponse.CancelReasonResponse> reasons = rawReasons.stream()
                .map(row -> CancelStatsResponse.CancelReasonResponse.builder()
                        .reason((String) row[0])
                        .count((Long) row[1])
                        .build())
                .collect(Collectors.toList());
                
        return CancelStatsResponse.builder()
                .totalCancelled(count)
                .totalLostRevenue(amount)
                .topReasons(reasons)
                .build();
    }
}
