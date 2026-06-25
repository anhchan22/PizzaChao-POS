package com.example.pizzachaongon.repository;

import com.example.pizzachaongon.entity.Order;
import com.example.pizzachaongon.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("SELECT COALESCE(MAX(o.queueNumber), 0) FROM Order o WHERE o.shift.id = :shiftId")
    Integer findMaxQueueNumberByShiftId(Long shiftId);

    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    @Query("""
            SELECT o FROM Order o
            WHERE o.status IN :statuses
              AND (
                :keyword IS NULL
                OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(o.customerName, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR COALESCE(o.customerPhone, '') LIKE CONCAT('%', :keyword, '%')
              )
            """)
    Page<Order> findByStatusesAndKeyword(
            @Param("statuses") Collection<OrderStatus> statuses,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query("""
            SELECT o FROM Order o
            WHERE :keyword IS NULL
               OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(COALESCE(o.customerName, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR COALESCE(o.customerPhone, '') LIKE CONCAT('%', :keyword, '%')
            """)
    Page<Order> findAllByKeyword(@Param("keyword") String keyword, Pageable pageable);
    
    // Tìm kiếm theo tên khách, sđt hoặc mã đơn
    Page<Order> findByOrderCodeContainingIgnoreCaseOrCustomerNameContainingIgnoreCaseOrCustomerPhoneContaining(
            String code, String name, String phone, Pageable pageable);
}
