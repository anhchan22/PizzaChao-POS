package com.example.pizzachaongon.repository;

import com.example.pizzachaongon.entity.Order;
import com.example.pizzachaongon.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

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
              AND (cast(:fromDate as timestamp) IS NULL OR o.createdAt >= :fromDate)
              AND (cast(:toDate as timestamp) IS NULL OR o.createdAt <= :toDate)
              AND (:shiftId IS NULL OR o.shift.id = :shiftId)
            """)
    Page<Order> findByStatusesAndKeyword(
            @Param("statuses") Collection<OrderStatus> statuses,
            @Param("keyword") String keyword,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            @Param("shiftId") Long shiftId,
            Pageable pageable
    );

    @Query("""
            SELECT o FROM Order o
            WHERE (:keyword IS NULL
               OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(COALESCE(o.customerName, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR COALESCE(o.customerPhone, '') LIKE CONCAT('%', :keyword, '%'))
              AND (cast(:fromDate as timestamp) IS NULL OR o.createdAt >= :fromDate)
              AND (cast(:toDate as timestamp) IS NULL OR o.createdAt <= :toDate)
              AND (:shiftId IS NULL OR o.shift.id = :shiftId)
            """)
    Page<Order> findAllByKeyword(
            @Param("keyword") String keyword, 
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            @Param("shiftId") Long shiftId,
            Pageable pageable);
    
    // Tìm kiếm theo tên khách, sđt hoặc mã đơn
    Page<Order> findByOrderCodeContainingIgnoreCaseOrCustomerNameContainingIgnoreCaseOrCustomerPhoneContaining(
            String code, String name, String phone, Pageable pageable);

    // Report: tổng doanh thu
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status = 'COMPLETED' AND o.createdAt >= :from AND o.createdAt < :to")
    BigDecimal sumRevenue(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = 'COMPLETED' AND o.createdAt >= :from AND o.createdAt < :to")
    Long countCompleted(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    // Report: doanh thu theo PTTT
    @Query("SELECT o.paymentMethod, COALESCE(SUM(o.totalAmount), 0), COUNT(o) FROM Order o WHERE o.status = 'COMPLETED' AND o.createdAt >= :from AND o.createdAt < :to GROUP BY o.paymentMethod")
    List<Object[]> revenueByPaymentMethod(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    // Report: doanh thu theo ngày
    @Query("SELECT CAST(o.createdAt AS date), COUNT(o), COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status = 'COMPLETED' AND o.createdAt >= :from AND o.createdAt < :to GROUP BY CAST(o.createdAt AS date) ORDER BY CAST(o.createdAt AS date)")
    List<Object[]> dailyRevenue(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    // Report: doanh số theo giờ
    @Query(value = "SELECT HOUR(o.created_at) as h, COUNT(*), COALESCE(SUM(o.total_amount), 0) FROM orders o WHERE o.status = 'COMPLETED' AND DATE(o.created_at) = :date GROUP BY HOUR(o.created_at) ORDER BY h", nativeQuery = true)
    List<Object[]> hourlySales(@Param("date") LocalDate date);

    @Query(value = "SELECT HOUR(o.created_at) as h, COUNT(*), COALESCE(SUM(o.total_amount), 0) FROM orders o WHERE o.status = 'COMPLETED' AND o.created_at >= :from AND o.created_at < :to GROUP BY HOUR(o.created_at) ORDER BY h", nativeQuery = true)
    List<Object[]> hourlySalesRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    // Report: top sản phẩm
    @Query("SELECT oi.productName, SUM(oi.quantity), COALESCE(SUM(oi.totalPrice), 0) FROM OrderItem oi JOIN oi.order o WHERE o.status = 'COMPLETED' AND o.createdAt >= :from AND o.createdAt < :to GROUP BY oi.productName ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> topProducts(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    // Report: thống kê hủy
    @Query("SELECT COUNT(o), COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status = 'CANCELLED' AND o.createdAt >= :from AND o.createdAt < :to")
    List<Object[]> cancelStats(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    // Report: lý do hủy phổ biến
    @Query("SELECT o.cancelReason, COUNT(o) FROM Order o WHERE o.status = 'CANCELLED' AND o.cancelReason IS NOT NULL AND o.createdAt >= :from AND o.createdAt < :to GROUP BY o.cancelReason ORDER BY COUNT(o) DESC")
    List<Object[]> topCancelReasons(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    // Report: doanh thu theo ca
    @Query("SELECT o.shift.id, COALESCE(SUM(o.totalAmount), 0), COUNT(o) FROM Order o WHERE o.status = 'COMPLETED' AND o.createdAt >= :from AND o.createdAt < :to GROUP BY o.shift.id")
    List<Object[]> revenueByShift(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.shift.id = :shiftId AND o.status <> 'CANCELLED'")
    BigDecimal sumRevenueByShiftId(@Param("shiftId") Long shiftId);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.shift.id = :shiftId AND o.status <> 'CANCELLED'")
    Long countPaidByShiftId(@Param("shiftId") Long shiftId);

    @Query("SELECT o.paymentMethod, COALESCE(SUM(o.totalAmount), 0), COUNT(o) FROM Order o WHERE o.shift.id = :shiftId AND o.status <> 'CANCELLED' GROUP BY o.paymentMethod")
    List<Object[]> revenueByPaymentMethodAndShiftId(@Param("shiftId") Long shiftId);

    @Query("SELECT oi.productName, SUM(oi.quantity), COALESCE(SUM(oi.totalPrice), 0) FROM OrderItem oi JOIN oi.order o WHERE o.shift.id = :shiftId AND o.status <> 'CANCELLED' GROUP BY oi.productName ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> topProductsByShiftId(@Param("shiftId") Long shiftId);
}
