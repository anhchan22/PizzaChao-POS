package com.example.pizzachaongon.entity;

import com.example.pizzachaongon.enums.ExpenseType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "expenses",
        indexes = {
                @Index(name = "idx_expenses_type", columnList = "type"),
                @Index(name = "idx_expenses_incurred_at", columnList = "incurred_at"),
                @Index(name = "idx_expenses_created_by", columnList = "created_by"),
                @Index(name = "idx_expenses_shift_id", columnList = "shift_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Expense extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ExpenseType type;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "incurred_at", nullable = false)
    private LocalDateTime incurredAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id")
    private Shift shift;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "receipt_image_url", length = 500)
    private String receiptImageUrl;

    @Column(length = 500)
    private String note;
}
