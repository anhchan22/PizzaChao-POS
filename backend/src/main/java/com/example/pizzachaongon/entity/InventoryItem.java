package com.example.pizzachaongon.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "inventory_items",
        indexes = {
                @Index(name = "idx_inventory_items_active", columnList = "active"),
                @Index(name = "idx_inventory_items_name", columnList = "name")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItem extends BaseEntity {

    @Column(nullable = false, unique = true, length = 120)
    private String name;

    @Column(nullable = false, length = 30)
    private String unit;

    @Column(name = "current_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal currentQuantity;

    @Column(name = "warning_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal warningQuantity;

    @Column(name = "last_stocktake_at", nullable = false)
    private LocalDateTime lastStocktakeAt;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(length = 500)
    private String note;

    @OneToMany(mappedBy = "inventoryItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InventoryUsageRule> usageRules = new ArrayList<>();
}
