package com.example.pizzachaongon.repository;

import com.example.pizzachaongon.entity.ShiftInventoryCount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShiftInventoryCountRepository extends JpaRepository<ShiftInventoryCount, Long> {
    @Query("""
            SELECT c FROM ShiftInventoryCount c
            JOIN FETCH c.inventoryItem
            WHERE c.shift.id = :shiftId
            ORDER BY c.inventoryItem.name ASC
            """)
    List<ShiftInventoryCount> findByShiftIdOrderByInventoryItemNameAsc(@Param("shiftId") Long shiftId);
}
