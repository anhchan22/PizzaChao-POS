package com.example.pizzachaongon.repository;

import com.example.pizzachaongon.entity.InventoryUsageRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryUsageRuleRepository extends JpaRepository<InventoryUsageRule, Long> {
}
