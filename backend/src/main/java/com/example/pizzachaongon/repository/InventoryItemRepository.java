package com.example.pizzachaongon.repository;

import com.example.pizzachaongon.entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    boolean existsByNameIgnoreCase(String name);

    Optional<InventoryItem> findByNameIgnoreCase(String name);

    @Query("""
            SELECT i FROM InventoryItem i
            WHERE (:active IS NULL OR i.active = :active)
              AND (:keyword IS NULL OR LOWER(i.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(COALESCE(i.note, '')) LIKE LOWER(CONCAT('%', :keyword, '%')))
            ORDER BY i.name ASC
            """)
    List<InventoryItem> findWithFilters(@Param("active") Boolean active, @Param("keyword") String keyword);

    @Query("SELECT i FROM InventoryItem i WHERE i.active = true AND i.currentQuantity <= i.warningQuantity")
    List<InventoryItem> findLowStock();
}
