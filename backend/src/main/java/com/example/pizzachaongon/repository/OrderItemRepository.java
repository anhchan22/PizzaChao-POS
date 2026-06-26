package com.example.pizzachaongon.repository;

import com.example.pizzachaongon.entity.OrderItem;
import com.example.pizzachaongon.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("""
            SELECT COALESCE(SUM(oi.quantity), 0)
            FROM OrderItem oi
            WHERE oi.sizeId = :sizeId
              AND oi.order.status IN :statuses
              AND oi.order.createdAt >= :fromTime
            """)
    Long sumQuantityBySizeSince(
            @Param("sizeId") Long sizeId,
            @Param("statuses") Collection<OrderStatus> statuses,
            @Param("fromTime") LocalDateTime fromTime
    );
}
