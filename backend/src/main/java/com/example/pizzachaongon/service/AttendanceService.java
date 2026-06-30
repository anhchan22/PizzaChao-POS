package com.example.pizzachaongon.service;

import com.example.pizzachaongon.dto.request.AttendanceNoteRequest;
import com.example.pizzachaongon.dto.response.AttendanceSummaryResponse;
import com.example.pizzachaongon.dto.response.EmployeeAttendanceDetailResponse;
import com.example.pizzachaongon.entity.Shift;
import com.example.pizzachaongon.entity.User;
import com.example.pizzachaongon.enums.ShiftStatus;
import com.example.pizzachaongon.exception.BadRequestException;
import com.example.pizzachaongon.exception.ResourceNotFoundException;
import com.example.pizzachaongon.repository.OrderRepository;
import com.example.pizzachaongon.repository.ShiftRepository;
import com.example.pizzachaongon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {
    private final ShiftRepository shiftRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public AttendanceSummaryResponse getSummary(LocalDate fromDate, LocalDate toDate, Long userId, ShiftStatus status) {
        DateRange range = validateAndNormalizeRange(fromDate, toDate);
        ShiftStatus filterStatus = status != null ? status : ShiftStatus.CLOSED;
        List<Shift> shifts = shiftRepository.findAttendanceShifts(
                userId,
                filterStatus,
                range.from().atStartOfDay(),
                range.to().plusDays(1).atStartOfDay()
        );

        Map<Long, EmployeeAccumulator> grouped = new LinkedHashMap<>();
        for (Shift shift : shifts) {
            User user = shift.getOpenedBy();
            EmployeeAccumulator accumulator = grouped.computeIfAbsent(user.getId(), id -> new EmployeeAccumulator(user));
            accumulator.addShift(shift);
        }

        List<AttendanceSummaryResponse.EmployeeAttendanceSummary> employees = grouped.values()
                .stream()
                .map(EmployeeAccumulator::toResponse)
                .sorted(Comparator.comparingLong(AttendanceSummaryResponse.EmployeeAttendanceSummary::getTotalWorkedMinutes).reversed())
                .toList();

        long totalWorkedMinutes = employees.stream()
                .mapToLong(AttendanceSummaryResponse.EmployeeAttendanceSummary::getTotalWorkedMinutes)
                .sum();
        long totalShifts = employees.stream()
                .mapToLong(AttendanceSummaryResponse.EmployeeAttendanceSummary::getTotalShifts)
                .sum();

        return AttendanceSummaryResponse.builder()
                .fromDate(range.from())
                .toDate(range.to())
                .totalEmployees(employees.size())
                .totalShifts(totalShifts)
                .totalWorkedMinutes(totalWorkedMinutes)
                .topEmployee(employees.isEmpty() ? null : employees.get(0))
                .employees(employees)
                .build();
    }

    @Transactional(readOnly = true)
    public EmployeeAttendanceDetailResponse getEmployeeDetail(Long userId, LocalDate fromDate, LocalDate toDate, ShiftStatus status) {
        DateRange range = validateAndNormalizeRange(fromDate, toDate);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với id: " + userId));

        List<Shift> shifts = shiftRepository.findAttendanceShifts(
                userId,
                status,
                range.from().atStartOfDay(),
                range.to().plusDays(1).atStartOfDay()
        );

        Map<Long, BigDecimal> revenueByShift = orderRepository.revenueByShift(
                        range.from().atStartOfDay(),
                        range.to().plusDays(1).atStartOfDay()
                )
                .stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (BigDecimal) row[1],
                        (left, right) -> left
                ));

        long countedShifts = shifts.stream().filter(shift -> shift.getStatus() == ShiftStatus.CLOSED).count();
        long totalWorkedMinutes = shifts.stream()
                .filter(shift -> shift.getStatus() == ShiftStatus.CLOSED)
                .mapToLong(this::resolveWorkedMinutes)
                .sum();
        double averageHours = countedShifts == 0 ? 0 : roundHours(totalWorkedMinutes / 60.0 / countedShifts);

        List<EmployeeAttendanceDetailResponse.AttendanceShift> shiftResponses = shifts.stream()
                .map(shift -> {
                    long workedMinutes = shift.getStatus() == ShiftStatus.CLOSED ? resolveWorkedMinutes(shift) : 0;
                    return EmployeeAttendanceDetailResponse.AttendanceShift.builder()
                            .shiftId(shift.getId())
                            .workDate(shift.getOpenedAt().toLocalDate())
                            .openedAt(shift.getOpenedAt())
                            .closedAt(shift.getClosedAt())
                            .workedMinutes(shift.getStatus() == ShiftStatus.CLOSED ? (int) workedMinutes : null)
                            .workedHours(roundHours(workedMinutes / 60.0))
                            .totalRevenue(revenueByShift.getOrDefault(shift.getId(), BigDecimal.ZERO))
                            .status(shift.getStatus())
                            .openingNote(shift.getOpeningNote())
                            .closingNote(shift.getClosingNote())
                            .attendanceNote(shift.getAttendanceNote())
                            .build();
                })
                .toList();

        return EmployeeAttendanceDetailResponse.builder()
                .user(EmployeeAttendanceDetailResponse.AttendanceUser.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .phone(user.getPhone())
                        .build())
                .summary(EmployeeAttendanceDetailResponse.AttendanceTotals.builder()
                        .totalShifts(countedShifts)
                        .totalWorkedMinutes(totalWorkedMinutes)
                        .totalWorkedHours(roundHours(totalWorkedMinutes / 60.0))
                        .averageHoursPerShift(averageHours)
                        .build())
                .shifts(shiftResponses)
                .build();
    }

    @Transactional
    public void updateAttendanceNote(Long shiftId, AttendanceNoteRequest request) {
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ca làm việc với id: " + shiftId));
        shift.setAttendanceNote(StringUtils.hasText(request.getAttendanceNote())
                ? request.getAttendanceNote().trim()
                : null);
        shiftRepository.save(shift);
    }

    private DateRange validateAndNormalizeRange(LocalDate fromDate, LocalDate toDate) {
        LocalDate from = fromDate != null ? fromDate : LocalDate.now().withDayOfMonth(1);
        LocalDate to = toDate != null ? toDate : LocalDate.now();
        if (to.isBefore(from)) {
            throw new BadRequestException("Ngày kết thúc không được trước ngày bắt đầu.");
        }
        if (to.isAfter(from.plusMonths(1))) {
            throw new BadRequestException("Khoảng thời gian chấm công tối đa là 1 tháng.");
        }
        return new DateRange(from, to);
    }

    private long resolveWorkedMinutes(Shift shift) {
        if (shift.getWorkedMinutes() != null) {
            return Math.max(shift.getWorkedMinutes(), 0);
        }
        if (shift.getOpenedAt() == null || shift.getClosedAt() == null || !shift.getClosedAt().isAfter(shift.getOpenedAt())) {
            return 0;
        }
        return Math.max(Duration.between(shift.getOpenedAt(), shift.getClosedAt()).toMinutes(), 0);
    }

    private double roundHours(double hours) {
        return Math.round(hours * 10.0) / 10.0;
    }

    private record DateRange(LocalDate from, LocalDate to) {
    }

    private class EmployeeAccumulator {
        private final User user;
        private long totalShifts;
        private long totalWorkedMinutes;
        private LocalDateTime lastShiftAt;

        private EmployeeAccumulator(User user) {
            this.user = user;
        }

        private void addShift(Shift shift) {
            if (shift.getStatus() == ShiftStatus.CLOSED) {
                totalWorkedMinutes += resolveWorkedMinutes(shift);
            }
            totalShifts += 1;
            LocalDateTime shiftTime = shift.getClosedAt() != null ? shift.getClosedAt() : shift.getOpenedAt();
            if (lastShiftAt == null || shiftTime.isAfter(lastShiftAt)) {
                lastShiftAt = shiftTime;
            }
        }

        private AttendanceSummaryResponse.EmployeeAttendanceSummary toResponse() {
            return AttendanceSummaryResponse.EmployeeAttendanceSummary.builder()
                    .userId(user.getId())
                    .fullName(user.getFullName())
                    .phone(user.getPhone())
                    .totalShifts(totalShifts)
                    .totalWorkedMinutes(totalWorkedMinutes)
                    .totalWorkedHours(roundHours(totalWorkedMinutes / 60.0))
                    .averageHoursPerShift(totalShifts == 0 ? 0 : roundHours(totalWorkedMinutes / 60.0 / totalShifts))
                    .lastShiftAt(lastShiftAt)
                    .build();
        }
    }
}
