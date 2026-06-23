package com.example.pizzachaongon.service;

import com.example.pizzachaongon.dto.request.ShiftCloseRequest;
import com.example.pizzachaongon.dto.request.ShiftOpenRequest;
import com.example.pizzachaongon.dto.response.ShiftResponse;
import com.example.pizzachaongon.entity.Shift;
import com.example.pizzachaongon.entity.User;
import com.example.pizzachaongon.enums.ShiftStatus;
import com.example.pizzachaongon.exception.BadRequestException;
import com.example.pizzachaongon.repository.ShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ShiftService {
    private final ShiftRepository shiftRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public ShiftResponse getCurrentShift() {
        return shiftRepository.findByStatus(ShiftStatus.OPEN)
                .map(this::mapToResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public Shift getActiveShiftEntity() {
        return shiftRepository.findByStatus(ShiftStatus.OPEN)
                .orElseThrow(() -> new BadRequestException("Không có ca làm việc nào đang mở. Vui lòng mở ca trước."));
    }

    @Transactional
    public ShiftResponse openShift(ShiftOpenRequest request) {
        Optional<Shift> current = shiftRepository.findByStatus(ShiftStatus.OPEN);
        if (current.isPresent()) {
            throw new BadRequestException("Đã có một ca làm việc đang mở. Vui lòng đóng ca trước khi mở ca mới.");
        }

        User currentUser = userService.getCurrentUser();
        Shift shift = Shift.builder()
                .openedBy(currentUser)
                .openedAt(LocalDateTime.now())
                .startingCash(request.getStartingCash())
                .status(ShiftStatus.OPEN)
                .build();

        shift = shiftRepository.save(shift);
        return mapToResponse(shift);
    }

    @Transactional
    public ShiftResponse closeShift(ShiftCloseRequest request) {
        Shift shift = getActiveShiftEntity();
        User currentUser = userService.getCurrentUser();

        shift.setClosedBy(currentUser);
        shift.setClosedAt(LocalDateTime.now());
        shift.setActualCash(request.getActualCash());
        shift.setNote(request.getNote());
        shift.setStatus(ShiftStatus.CLOSED);

        shift = shiftRepository.save(shift);
        return mapToResponse(shift);
    }

    public ShiftResponse mapToResponse(Shift shift) {
        return ShiftResponse.builder()
                .id(shift.getId())
                .openedByName(shift.getOpenedBy().getFullName())
                .closedByName(shift.getClosedBy() != null ? shift.getClosedBy().getFullName() : null)
                .openedAt(shift.getOpenedAt())
                .closedAt(shift.getClosedAt())
                .startingCash(shift.getStartingCash())
                .expectedCash(shift.getExpectedCash())
                .actualCash(shift.getActualCash())
                .note(shift.getNote())
                .status(shift.getStatus())
                .build();
    }
}
