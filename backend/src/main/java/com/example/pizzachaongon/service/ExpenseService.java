package com.example.pizzachaongon.service;

import com.example.pizzachaongon.dto.request.ExpenseRequest;
import com.example.pizzachaongon.dto.response.ExpenseResponse;
import com.example.pizzachaongon.entity.Expense;
import com.example.pizzachaongon.entity.Shift;
import com.example.pizzachaongon.entity.User;
import com.example.pizzachaongon.enums.ExpenseType;
import com.example.pizzachaongon.enums.UserRole;
import com.example.pizzachaongon.exception.ForbiddenException;
import com.example.pizzachaongon.exception.ResourceNotFoundException;
import com.example.pizzachaongon.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ExpenseService {
    private final ExpenseRepository expenseRepository;
    private final UserService userService;
    private final ShiftService shiftService;

    @Transactional(readOnly = true)
    public Page<ExpenseResponse> getAll(
            ExpenseType type,
            Boolean shiftOnly,
            LocalDate fromDate,
            LocalDate toDate,
            String keyword,
            Pageable pageable
    ) {
        User currentUser = userService.getCurrentUser();
        Long createdById = currentUser.getRole() == UserRole.OWNER ? null : currentUser.getId();
        LocalDateTime from = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime toExclusive = toDate != null ? toDate.plusDays(1).atStartOfDay() : null;
        String normalizedKeyword = StringUtils.hasText(keyword) ? keyword.trim() : null;

        return expenseRepository.findWithFilters(
                type,
                createdById,
                shiftOnly,
                from,
                toExclusive,
                normalizedKeyword,
                pageable
        ).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public ExpenseResponse getById(Long id) {
        Expense expense = getAuthorizedExpense(id);
        return mapToResponse(expense);
    }

    @Transactional
    public ExpenseResponse create(ExpenseRequest request) {
        User currentUser = userService.getCurrentUser();
        Shift shift = request.isAttachToCurrentShift() ? shiftService.getActiveShiftEntity() : null;

        Expense expense = Expense.builder()
                .type(request.getType())
                .title(request.getTitle().trim())
                .amount(request.getAmount())
                .incurredAt(request.getIncurredAt() != null ? request.getIncurredAt() : LocalDateTime.now())
                .shift(shift)
                .createdBy(currentUser)
                .receiptImageUrl(normalize(request.getReceiptImageUrl()))
                .note(normalize(request.getNote()))
                .build();

        return mapToResponse(expenseRepository.save(expense));
    }

    @Transactional
    public ExpenseResponse update(Long id, ExpenseRequest request) {
        Expense expense = getAuthorizedExpense(id);
        Shift shift = request.isAttachToCurrentShift() ? shiftService.getActiveShiftEntity() : null;

        expense.setType(request.getType());
        expense.setTitle(request.getTitle().trim());
        expense.setAmount(request.getAmount());
        expense.setIncurredAt(request.getIncurredAt() != null ? request.getIncurredAt() : expense.getIncurredAt());
        expense.setShift(shift);
        expense.setReceiptImageUrl(normalize(request.getReceiptImageUrl()));
        expense.setNote(normalize(request.getNote()));

        return mapToResponse(expenseRepository.save(expense));
    }

    @Transactional
    public void delete(Long id) {
        Expense expense = getAuthorizedExpense(id);
        expenseRepository.delete(expense);
    }

    private Expense getAuthorizedExpense(Long id) {
        User currentUser = userService.getCurrentUser();
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoản chi với id: " + id));

        if (currentUser.getRole() != UserRole.OWNER && !expense.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Bạn không có quyền thao tác với khoản chi này");
        }
        return expense;
    }

    private ExpenseResponse mapToResponse(Expense expense) {
        Shift shift = expense.getShift();
        return ExpenseResponse.builder()
                .id(expense.getId())
                .type(expense.getType())
                .title(expense.getTitle())
                .amount(expense.getAmount())
                .incurredAt(expense.getIncurredAt())
                .shiftId(shift != null ? shift.getId() : null)
                .shiftLabel(shift != null ? "Ca #" + shift.getId() : null)
                .createdById(expense.getCreatedBy().getId())
                .createdByName(expense.getCreatedBy().getFullName())
                .receiptImageUrl(expense.getReceiptImageUrl())
                .note(expense.getNote())
                .createdAt(expense.getCreatedAt())
                .updatedAt(expense.getUpdatedAt())
                .build();
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
