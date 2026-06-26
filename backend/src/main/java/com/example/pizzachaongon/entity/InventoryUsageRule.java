package com.example.pizzachaongon.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "inventory_usage_rules",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_inventory_usage_item_size", columnNames = {"inventory_item_id", "size_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryUsageRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    private InventoryItem inventoryItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "size_id", nullable = false)
    private Size size;

    @Column(name = "quantity_per_order", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantityPerOrder;
}
