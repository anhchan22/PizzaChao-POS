package com.example.pizzachaongon.service;

import com.example.pizzachaongon.dto.request.InventoryItemRequest;
import com.example.pizzachaongon.dto.request.InventoryUsageRuleRequest;
import com.example.pizzachaongon.dto.request.ShiftInventoryStocktakeRequest;
import com.example.pizzachaongon.dto.request.StockInRequest;
import com.example.pizzachaongon.dto.response.InventoryItemResponse;
import com.example.pizzachaongon.dto.response.InventoryUsageRuleResponse;
import com.example.pizzachaongon.dto.response.StockMovementResponse;
import com.example.pizzachaongon.entity.InventoryItem;
import com.example.pizzachaongon.entity.InventoryUsageRule;
import com.example.pizzachaongon.entity.Shift;
import com.example.pizzachaongon.entity.ShiftInventoryCount;
import com.example.pizzachaongon.entity.Size;
import com.example.pizzachaongon.entity.StockMovement;
import com.example.pizzachaongon.entity.User;
import com.example.pizzachaongon.enums.OrderStatus;
import com.example.pizzachaongon.enums.StockMovementType;
import com.example.pizzachaongon.exception.BadRequestException;
import com.example.pizzachaongon.exception.ResourceNotFoundException;
import com.example.pizzachaongon.repository.InventoryItemRepository;
import com.example.pizzachaongon.repository.OrderItemRepository;
import com.example.pizzachaongon.repository.ShiftInventoryCountRepository;
import com.example.pizzachaongon.repository.SizeRepository;
import com.example.pizzachaongon.repository.StockMovementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class InventoryService {
    private final InventoryItemRepository inventoryItemRepository;
    private final SizeRepository sizeRepository;
    private final OrderItemRepository orderItemRepository;
    private final StockMovementRepository stockMovementRepository;
    private final ShiftInventoryCountRepository shiftInventoryCountRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<InventoryItemResponse> getAll(Boolean active, String keyword) {
        String normalizedKeyword = StringUtils.hasText(keyword) ? keyword.trim() : null;
        return inventoryItemRepository.findWithFilters(active, normalizedKeyword)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InventoryItemResponse> getLowStock() {
        return inventoryItemRepository.findWithFilters(true, null)
                .stream()
                .map(this::mapToResponse)
                .filter(InventoryItemResponse::isLowStock)
                .toList();
    }

    @Transactional(readOnly = true)
    public InventoryItemResponse getById(Long id) {
        return mapToResponse(findById(id));
    }

    @Transactional
    public InventoryItemResponse create(InventoryItemRequest request) {
        String name = request.getName().trim();
        if (inventoryItemRepository.existsByNameIgnoreCase(name)) {
            throw new BadRequestException("Vật tư '" + name + "' đã tồn tại");
        }

        InventoryItem item = InventoryItem.builder()
                .name(name)
                .unit(request.getUnit().trim())
                .currentQuantity(request.getCurrentQuantity())
                .warningQuantity(request.getWarningQuantity())
                .lastStocktakeAt(LocalDateTime.now())
                .active(request.getActive() == null || request.getActive())
                .note(normalize(request.getNote()))
                .build();
        applyUsageRules(item, request.getUsageRules());
        return mapToResponse(inventoryItemRepository.save(item));
    }

    @Transactional
    public InventoryItemResponse update(Long id, InventoryItemRequest request) {
        InventoryItem item = findById(id);
        String name = request.getName().trim();
        inventoryItemRepository.findByNameIgnoreCase(name)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new BadRequestException("Vật tư '" + name + "' đã tồn tại");
                });

        if (item.getCurrentQuantity().compareTo(request.getCurrentQuantity()) != 0) {
            throw new BadRequestException("Không cập nhật tồn trực tiếp trong form sửa vật tư. Vui lòng dùng Nhập hàng hoặc kiểm kê khi đóng ca.");
        }
        item.setName(name);
        item.setUnit(request.getUnit().trim());
        item.setWarningQuantity(request.getWarningQuantity());
        item.setActive(request.getActive() == null || request.getActive());
        item.setNote(normalize(request.getNote()));

        item.getUsageRules().clear();
        applyUsageRules(item, request.getUsageRules());
        return mapToResponse(inventoryItemRepository.save(item));
    }

    @Transactional
    public InventoryItemResponse stockIn(Long id, StockInRequest request) {
        InventoryItem item = findById(id);
        BigDecimal beforeQuantity = item.getCurrentQuantity();
        BigDecimal afterQuantity = beforeQuantity.add(request.getQuantity());
        item.setCurrentQuantity(afterQuantity);
        inventoryItemRepository.save(item);
        stockMovementRepository.save(StockMovement.builder()
                .inventoryItem(item)
                .type(StockMovementType.IN)
                .quantityChange(request.getQuantity())
                .beforeQuantity(beforeQuantity)
                .afterQuantity(afterQuantity)
                .note(normalize(request.getNote()))
                .createdBy(userService.getCurrentUser())
                .build());
        return mapToResponse(item);
    }

    @Transactional
    public void applyShiftCloseCounts(Shift shift, User closedBy, List<ShiftInventoryStocktakeRequest> counts) {
        if (counts == null || counts.isEmpty()) {
            return;
        }
        LocalDateTime stocktakeTime = LocalDateTime.now();
        for (ShiftInventoryStocktakeRequest count : counts) {
            InventoryItem item = findById(count.getInventoryItemId());
            BigDecimal expectedQuantity = calculateEstimatedRemaining(item);
            BigDecimal actualQuantity = count.getActualQuantity();
            BigDecimal differenceQuantity = actualQuantity.subtract(expectedQuantity);
            String note = normalize(count.getNote());

            shiftInventoryCountRepository.save(ShiftInventoryCount.builder()
                    .shift(shift)
                    .inventoryItem(item)
                    .expectedQuantity(expectedQuantity)
                    .actualQuantity(actualQuantity)
                    .differenceQuantity(differenceQuantity)
                    .note(note)
                    .createdBy(closedBy)
                    .build());

            if (differenceQuantity.signum() != 0) {
                String movementNote = "Kiểm kho khi đóng ca #" + shift.getId();
                if (StringUtils.hasText(note)) {
                    movementNote += " - " + note;
                }
                stockMovementRepository.save(StockMovement.builder()
                        .inventoryItem(item)
                        .shift(shift)
                        .type(StockMovementType.SHIFT_CLOSE_ADJUST)
                        .quantityChange(differenceQuantity)
                        .beforeQuantity(expectedQuantity)
                        .afterQuantity(actualQuantity)
                        .note(movementNote)
                        .createdBy(closedBy)
                        .build());
            }

            item.setCurrentQuantity(actualQuantity);
            item.setLastStocktakeAt(stocktakeTime);
            inventoryItemRepository.save(item);
        }
    }

    @Transactional(readOnly = true)
    public List<StockMovementResponse> getMovements(Long itemId) {
        findById(itemId);
        return stockMovementRepository.findByInventoryItemIdOrderByCreatedAtDescIdDesc(itemId)
                .stream()
                .map(this::mapMovementToResponse)
                .toList();
    }

    @Transactional
    public void delete(Long id) {
        InventoryItem item = findById(id);
        inventoryItemRepository.delete(item);
    }

    private InventoryItem findById(Long id) {
        return inventoryItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vật tư với id: " + id));
    }

    private void applyUsageRules(InventoryItem item, List<InventoryUsageRuleRequest> rules) {
        if (rules == null) return;
        Set<Long> usedSizeIds = new HashSet<>();
        for (InventoryUsageRuleRequest request : rules) {
            if (!usedSizeIds.add(request.getSizeId())) {
                throw new BadRequestException("Không được cấu hình trùng size trong cùng một vật tư");
            }
            Size size = sizeRepository.findById(request.getSizeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy size với id: " + request.getSizeId()));
            InventoryUsageRule rule = InventoryUsageRule.builder()
                    .inventoryItem(item)
                    .size(size)
                    .quantityPerOrder(request.getQuantityPerOrder())
                    .build();
            item.getUsageRules().add(rule);
        }
    }

    private InventoryItemResponse mapToResponse(InventoryItem item) {
        BigDecimal estimatedUsed = calculateEstimatedUsed(item);
        BigDecimal estimatedRemaining = item.getCurrentQuantity().subtract(estimatedUsed);
        boolean lowStock = estimatedRemaining.compareTo(item.getWarningQuantity()) <= 0;

        return InventoryItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .unit(item.getUnit())
                .currentQuantity(item.getCurrentQuantity())
                .warningQuantity(item.getWarningQuantity())
                .estimatedUsed(estimatedUsed)
                .estimatedRemaining(estimatedRemaining)
                .lowStock(lowStock)
                .lastStocktakeAt(item.getLastStocktakeAt())
                .active(item.isActive())
                .note(item.getNote())
                .usageRules(item.getUsageRules().stream().map(rule -> InventoryUsageRuleResponse.builder()
                        .id(rule.getId())
                        .sizeId(rule.getSize().getId())
                        .sizeName(rule.getSize().getName())
                        .quantityPerOrder(rule.getQuantityPerOrder())
                        .build()).toList())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    private BigDecimal calculateEstimatedUsed(InventoryItem item) {
        return item.getUsageRules().stream()
                .map(rule -> {
                    Long soldQuantity = orderItemRepository.sumQuantityBySizeSince(
                            rule.getSize().getId(),
                            EnumSet.of(OrderStatus.PROCESSING, OrderStatus.COMPLETED),
                            item.getLastStocktakeAt()
                    );
                    return rule.getQuantityPerOrder().multiply(BigDecimal.valueOf(soldQuantity));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateEstimatedRemaining(InventoryItem item) {
        return item.getCurrentQuantity().subtract(calculateEstimatedUsed(item));
    }

    private StockMovementResponse mapMovementToResponse(StockMovement movement) {
        User createdBy = movement.getCreatedBy();
        return StockMovementResponse.builder()
                .id(movement.getId())
                .inventoryItemId(movement.getInventoryItem().getId())
                .inventoryItemName(movement.getInventoryItem().getName())
                .shiftId(movement.getShift() != null ? movement.getShift().getId() : null)
                .type(movement.getType())
                .quantityChange(movement.getQuantityChange())
                .beforeQuantity(movement.getBeforeQuantity())
                .afterQuantity(movement.getAfterQuantity())
                .note(movement.getNote())
                .createdById(createdBy != null ? createdBy.getId() : null)
                .createdByName(createdBy != null ? createdBy.getFullName() : null)
                .createdAt(movement.getCreatedAt())
                .build();
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
