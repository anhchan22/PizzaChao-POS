package com.example.pizzachaongon.repository;

import com.example.pizzachaongon.entity.Expense;
import com.example.pizzachaongon.enums.ExpenseType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    @Query("""
            SELECT e FROM Expense e
            WHERE (:type IS NULL OR e.type = :type)
              AND (:createdById IS NULL OR e.createdBy.id = :createdById)
              AND (:shiftOnly IS NULL OR (:shiftOnly = TRUE AND e.shift IS NOT NULL) OR (:shiftOnly = FALSE AND e.shift IS NULL))
              AND (:fromDate IS NULL OR e.incurredAt >= :fromDate)
              AND (:toDate IS NULL OR e.incurredAt < :toDate)
              AND (:keyword IS NULL OR LOWER(e.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(e.note) LIKE LOWER(CONCAT('%', :keyword, '%')))
            ORDER BY e.incurredAt DESC, e.id DESC
            """)
    Page<Expense> findWithFilters(
            @Param("type") ExpenseType type,
            @Param("createdById") Long createdById,
            @Param("shiftOnly") Boolean shiftOnly,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.incurredAt >= :from AND e.incurredAt < :to")
    BigDecimal sumExpenses(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.shift.id = :shiftId")
    BigDecimal sumExpensesByShiftId(@Param("shiftId") Long shiftId);

    @Query("SELECT e.type, COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.incurredAt >= :from AND e.incurredAt < :to GROUP BY e.type")
    List<Object[]> expensesByType(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
