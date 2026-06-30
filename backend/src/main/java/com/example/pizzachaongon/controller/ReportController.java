package com.example.pizzachaongon.controller;

import com.example.pizzachaongon.dto.response.*;
import com.example.pizzachaongon.exception.BadRequestException;
import com.example.pizzachaongon.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<DashboardResponse> getDashboard(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        DateRange range = resolveRange(date, from, to);
        return ResponseEntity.ok(reportService.getDashboard(
                range.from().atStartOfDay(),
                range.to().plusDays(1).atStartOfDay()
        ));
    }

    @GetMapping("/revenue")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<List<RevenueDataPoint>> getRevenue(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false, defaultValue = "DAY") String groupBy) {
        validateRange(from, to);
        return ResponseEntity.ok(reportService.getRevenue(from.atStartOfDay(), to.plusDays(1).atStartOfDay(), groupBy));
    }

    @GetMapping("/revenue-by-payment-method")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<PaymentMethodStats> getRevenueByPaymentMethod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        validateRange(from, to);
        return ResponseEntity.ok(reportService.getRevenueByPaymentMethod(from.atStartOfDay(), to.plusDays(1).atStartOfDay()));
    }

    @GetMapping("/top-products")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<List<TopProductResponse>> getTopProducts(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false, defaultValue = "10") Integer limit) {
        validateRange(from, to);
        return ResponseEntity.ok(reportService.getTopProducts(from.atStartOfDay(), to.plusDays(1).atStartOfDay(), limit));
    }

    @GetMapping("/hourly-sales")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<List<HourlySalesResponse>> getHourlySales(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        DateRange range = resolveRange(date, from, to);
        return ResponseEntity.ok(reportService.getHourlySales(
                range.from().atStartOfDay(),
                range.to().plusDays(1).atStartOfDay()
        ));
    }

    @GetMapping("/shift-summary")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<List<ShiftSummaryResponse>> getShiftSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long userId) {
        validateRange(from, to);
        return ResponseEntity.ok(reportService.getShiftSummary(from.atStartOfDay(), to.plusDays(1).atStartOfDay(), userId));
    }

    @GetMapping("/profit-estimate")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<ProfitEstimateResponse> getProfitEstimate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        validateRange(from, to);
        return ResponseEntity.ok(reportService.getProfitEstimate(from.atStartOfDay(), to.plusDays(1).atStartOfDay()));
    }

    @GetMapping("/cancel-stats")
    @PreAuthorize("hasAnyRole('OWNER', 'STAFF')")
    public ResponseEntity<CancelStatsResponse> getCancelStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        validateRange(from, to);
        return ResponseEntity.ok(reportService.getCancelStats(from.atStartOfDay(), to.plusDays(1).atStartOfDay()));
    }

    private DateRange resolveRange(LocalDate date, LocalDate from, LocalDate to) {
        LocalDate resolvedFrom = from != null ? from : (date != null ? date : LocalDate.now());
        LocalDate resolvedTo = to != null ? to : resolvedFrom;
        validateRange(resolvedFrom, resolvedTo);
        return new DateRange(resolvedFrom, resolvedTo);
    }

    private void validateRange(LocalDate from, LocalDate to) {
        if (to.isBefore(from)) {
            throw new BadRequestException("Ngày kết thúc không được trước ngày bắt đầu.");
        }
        if (to.isAfter(from.plusMonths(1))) {
            throw new BadRequestException("Khoảng thời gian báo cáo tối đa là 1 tháng.");
        }
    }

    private record DateRange(LocalDate from, LocalDate to) {
    }
}
