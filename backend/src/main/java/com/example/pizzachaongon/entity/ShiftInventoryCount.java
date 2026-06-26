package com.example.pizzachaongon.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "shift_inventory_counts",
        indexes = {
                @Index(name = "idx_shift_inventory_counts_shift", columnList = "shift_id"),
                @Index(name = "idx_shift_inventory_counts_item", columnList = "inventory_item_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShiftInventoryCount extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id", nullable = false)
    private Shift shift;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    private InventoryItem inventoryItem;

    @Column(name = "expected_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal expectedQuantity;

    @Column(name = "actual_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal actualQuantity;

    @Column(name = "difference_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal differenceQuantity;

    @Column(length = 500)
    private String note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
}
