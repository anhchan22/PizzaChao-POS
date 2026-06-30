package com.example.pizzachaongon.repository;

import com.example.pizzachaongon.entity.Shift;
import com.example.pizzachaongon.enums.ShiftStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShiftRepository extends JpaRepository<Shift, Long> {

    Optional<Shift> findByOpenedByIdAndStatus(Long openedById, ShiftStatus status);

    boolean existsByOpenedByIdAndStatus(Long openedById, ShiftStatus status);

    @Query("""
            SELECT s FROM Shift s
            WHERE (:userId IS NULL OR s.openedBy.id = :userId)
              AND (:status IS NULL OR s.status = :status)
              AND (:fromDate IS NULL OR s.openedAt >= :fromDate)
              AND (:toDate IS NULL OR s.openedAt < :toDate)
            ORDER BY s.openedAt DESC
            """)
    Page<Shift> findHistory(
            @Param("userId") Long userId,
            @Param("status") ShiftStatus status,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );

    @Query("""
            SELECT s FROM Shift s
            JOIN FETCH s.openedBy u
            LEFT JOIN FETCH s.closedBy
            WHERE (:userId IS NULL OR u.id = :userId)
              AND (:status IS NULL OR s.status = :status)
              AND s.openedAt >= :fromDate
              AND s.openedAt < :toDate
            ORDER BY s.openedAt DESC
            """)
    List<Shift> findAttendanceShifts(
            @Param("userId") Long userId,
            @Param("status") ShiftStatus status,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );
}
