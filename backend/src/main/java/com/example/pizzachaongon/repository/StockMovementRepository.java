package com.example.pizzachaongon.repository;

import com.example.pizzachaongon.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByInventoryItemIdOrderByCreatedAtDescIdDesc(Long inventoryItemId);
}
