package com.example.pizzachaongon.repository;

import com.example.pizzachaongon.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}
