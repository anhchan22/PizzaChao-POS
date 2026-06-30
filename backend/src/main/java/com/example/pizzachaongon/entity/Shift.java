package com.example.pizzachaongon.entity;

import com.example.pizzachaongon.enums.ShiftStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "shifts",
        indexes = {
                @Index(name = "idx_shifts_opened_by_status", columnList = "opened_by,status"),
                @Index(name = "idx_shifts_opened_at", columnList = "opened_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shift extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "opened_by", nullable = false)
    private User openedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "closed_by")
    private User closedBy;

    @Column(name = "opened_at", nullable = false)
    private LocalDateTime openedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "starting_cash", nullable = false, precision = 12, scale = 2)
    private BigDecimal startingCash;

    @Column(name = "expected_cash", nullable = false, precision = 12, scale = 2)
    private BigDecimal expectedCash;

    @Column(name = "actual_cash", precision = 12, scale = 2)
    private BigDecimal actualCash;

    @Column(name = "cash_difference", precision = 12, scale = 2)
    private BigDecimal cashDifference;

    @Column(name = "opening_note", length = 500)
    private String openingNote;

    @Column(name = "closing_note", length = 500)
    private String closingNote;

    @Column(name = "worked_minutes")
    private Integer workedMinutes;

    @Column(name = "attendance_note", length = 500)
    private String attendanceNote;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ShiftStatus status;
}
