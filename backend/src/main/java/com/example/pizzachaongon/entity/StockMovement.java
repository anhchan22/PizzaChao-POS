package com.example.pizzachaongon.entity;

import com.example.pizzachaongon.enums.StockMovementType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "stock_movements",
        indexes = {
                @Index(name = "idx_stock_movements_item", columnList = "inventory_item_id"),
                @Index(name = "idx_stock_movements_shift", columnList = "shift_id"),
                @Index(name = "idx_stock_movements_type", columnList = "type"),
                @Index(name = "idx_stock_movements_created_at", columnList = "created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockMovement extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    private InventoryItem inventoryItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id")
    private Shift shift;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StockMovementType type;

    @Column(name = "quantity_change", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantityChange;

    @Column(name = "before_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal beforeQuantity;

    @Column(name = "after_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal afterQuantity;

    @Column(length = 500)
    private String note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
}
