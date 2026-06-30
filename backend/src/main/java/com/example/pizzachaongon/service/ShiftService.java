package com.example.pizzachaongon.service;

import com.example.pizzachaongon.dto.request.ShiftCloseRequest;
import com.example.pizzachaongon.dto.request.ShiftOpenRequest;
import com.example.pizzachaongon.dto.response.ShiftResponse;
import com.example.pizzachaongon.entity.Shift;
import com.example.pizzachaongon.entity.User;
import com.example.pizzachaongon.enums.ShiftStatus;
import com.example.pizzachaongon.exception.BadRequestException;
import com.example.pizzachaongon.exception.ResourceNotFoundException;
import com.example.pizzachaongon.repository.ShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ShiftService {
    private final ShiftRepository shiftRepository;
    private final UserService userService;
    private final InventoryService inventoryService;

    @Transactional(readOnly = true)
    public ShiftResponse getCurrentShift() {
        User currentUser = userService.getCurrentUser();
        return shiftRepository.findByOpenedByIdAndStatus(currentUser.getId(), ShiftStatus.OPEN)
                .map(this::mapToResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public Shift getActiveShiftEntity() {
        User currentUser = userService.getCurrentUser();
        return shiftRepository.findByOpenedByIdAndStatus(currentUser.getId(), ShiftStatus.OPEN)
                .orElseThrow(() -> new BadRequestException(
                        "Bạn chưa có ca làm việc đang mở. Vui lòng mở ca trước."
                ));
    }

    @Transactional
    public ShiftResponse openShift(ShiftOpenRequest request) {
        User currentUser = userService.getCurrentUser();
        if (shiftRepository.existsByOpenedByIdAndStatus(currentUser.getId(), ShiftStatus.OPEN)) {
            throw new BadRequestException(
                    "Bạn đã có một ca đang mở. Vui lòng đóng ca trước khi mở ca mới."
            );
        }

        Shift shift = Shift.builder()
                .openedBy(currentUser)
                .openedAt(LocalDateTime.now())
                .startingCash(request.getStartingCash())
                .expectedCash(request.getStartingCash())
                .openingNote(normalizeNote(request.getOpeningNote()))
                .status(ShiftStatus.OPEN)
                .build();

        return mapToResponse(shiftRepository.save(shift));
    }

    @Transactional
    public ShiftResponse closeShift(ShiftCloseRequest request) {
        Shift shift = getActiveShiftEntity();
        User currentUser = userService.getCurrentUser();

        LocalDateTime closedAt = LocalDateTime.now();
        if (!closedAt.isAfter(shift.getOpenedAt())) {
            throw new BadRequestException("Thời gian đóng ca phải sau thời gian mở ca.");
        }
        long workedMinutes = Duration.between(shift.getOpenedAt(), closedAt).toMinutes();
        if (workedMinutes <= 0) {
            throw new BadRequestException("Thời gian làm việc phải lớn hơn 0 phút.");
        }

        shift.setClosedBy(currentUser);
        shift.setClosedAt(closedAt);
        shift.setWorkedMinutes((int) workedMinutes);
        shift.setActualCash(request.getActualCash());
        if (shift.getExpectedCash() == null) {
            shift.setExpectedCash(shift.getStartingCash());
        }
        shift.setCashDifference(request.getActualCash().subtract(shift.getExpectedCash()));

        String closingNote = normalizeNote(request.getClosingNote());
        if (shift.getCashDifference().signum() != 0 && !StringUtils.hasText(closingNote)) {
            throw new BadRequestException(
                    "Tiền cuối ca bị lệch. Vui lòng nhập lý do chênh lệch."
            );
        }

        shift.setClosingNote(closingNote);
        shift.setStatus(ShiftStatus.CLOSED);
        inventoryService.applyShiftCloseCounts(shift, currentUser, request.getInventoryCounts());
        return mapToResponse(shiftRepository.save(shift));
    }

    @Transactional(readOnly = true)
    public Page<ShiftResponse> getHistory(
            Long userId,
            ShiftStatus status,
            LocalDate fromDate,
            LocalDate toDate,
            Pageable pageable
    ) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new BadRequestException("Ngày bắt đầu không được sau ngày kết thúc.");
        }

        LocalDateTime from = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime toExclusive = toDate != null ? toDate.plusDays(1).atStartOfDay() : null;
        return shiftRepository.findHistory(userId, status, from, toExclusive, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public ShiftResponse getById(Long id) {
        Shift shift = shiftRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy ca làm việc với id: " + id
                ));
        return mapToResponse(shift);
    }

    public ShiftResponse mapToResponse(Shift shift) {
        var expectedCash = shift.getExpectedCash() != null
                ? shift.getExpectedCash()
                : shift.getStartingCash();
        return ShiftResponse.builder()
                .id(shift.getId())
                .openedById(shift.getOpenedBy().getId())
                .openedByName(shift.getOpenedBy().getFullName())
                .closedByName(shift.getClosedBy() != null ? shift.getClosedBy().getFullName() : null)
                .openedAt(shift.getOpenedAt())
                .closedAt(shift.getClosedAt())
                .startingCash(shift.getStartingCash())
                .expectedCash(expectedCash)
                .actualCash(shift.getActualCash())
                .cashDifference(shift.getCashDifference())
                .openingNote(shift.getOpeningNote())
                .closingNote(shift.getClosingNote())
                .workedMinutes(shift.getWorkedMinutes())
                .attendanceNote(shift.getAttendanceNote())
                .status(shift.getStatus())
                .build();
    }

    private String normalizeNote(String note) {
        return StringUtils.hasText(note) ? note.trim() : null;
    }
}
