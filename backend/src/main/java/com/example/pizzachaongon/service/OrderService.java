package com.example.pizzachaongon.service;

import com.example.pizzachaongon.dto.request.OrderItemRequest;
import com.example.pizzachaongon.dto.request.OrderRequest;
import com.example.pizzachaongon.dto.response.OrderItemOptionResponse;
import com.example.pizzachaongon.dto.response.OrderItemResponse;
import com.example.pizzachaongon.dto.response.OrderResponse;
import com.example.pizzachaongon.entity.*;
import com.example.pizzachaongon.enums.OrderStatus;
import com.example.pizzachaongon.repository.*;
import lombok.RequiredArgsConstructor;
import com.example.pizzachaongon.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductOptionRepository productOptionRepository;
    private final UserService userService;
    private final ShiftService shiftService;

    @Transactional
    public OrderResponse createOrder(OrderRequest request) {
        User currentUser = userService.getCurrentUser();
        Shift currentShift = shiftService.getActiveShiftEntity();

        Integer maxQueue = orderRepository.findMaxQueueNumberByShiftId(currentShift.getId());
        Integer nextQueue = maxQueue + 1;

        Order order = new Order();
        order.setOrderCode("ORD-" + System.currentTimeMillis());
        order.setCustomerName(request.getCustomerName());
        order.setCustomerPhone(request.getCustomerPhone());
        order.setPaymentMethod(request.getPaymentMethod());
        order.setStatus(OrderStatus.PENDING);
        order.setNote(request.getNote());
        order.setCreatedBy(currentUser);
        order.setShift(currentShift);
        order.setQueueNumber(nextQueue);

        BigDecimal totalOrderAmount = BigDecimal.ZERO;

        for (OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));
            
            ProductVariant variant = productVariantRepository.findByProductIdAndSizeId(product.getId(), itemReq.getSizeId())
                    .orElseThrow(() -> new RuntimeException("Sản phẩm không hỗ trợ kích cỡ này"));

            BigDecimal unitPrice = variant.getPrice();
            BigDecimal totalItemPrice = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));

            OrderItem orderItem = new OrderItem();
            orderItem.setProductId(product.getId());
            orderItem.setProductName(product.getName());
            orderItem.setSizeId(variant.getSize().getId());
            orderItem.setSizeName(variant.getSize().getName());
            orderItem.setQuantity(itemReq.getQuantity());
            orderItem.setUnitPrice(unitPrice);
            orderItem.setNote(itemReq.getNote());

            if (itemReq.getOptionIds() != null && !itemReq.getOptionIds().isEmpty()) {
                for (Long optionId : itemReq.getOptionIds()) {
                    ProductOption option = productOptionRepository.findById(optionId)
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy Topping"));

                    OrderItemOption orderItemOption = new OrderItemOption();
                    orderItemOption.setOptionId(option.getId());
                    orderItemOption.setOptionName(option.getName());
                    orderItemOption.setPrice(option.getPrice());
                    
                    orderItem.addOption(orderItemOption);
                    totalItemPrice = totalItemPrice.add(option.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity())));
                }
            }

            orderItem.setTotalPrice(totalItemPrice);
            order.addItem(orderItem);
            totalOrderAmount = totalOrderAmount.add(totalItemPrice);
        }

        order.setTotalAmount(totalOrderAmount);

        // Tạo Payment
        Payment payment = Payment.builder()
                .amount(totalOrderAmount.doubleValue())
                .paymentMethod(request.getPaymentMethod())
                .status(PaymentStatus.COMPLETED) // Ở phase này coi như thanh toán thành công ngay
                .order(order)
                .build();
        order.setPayment(payment);

        // Cộng dồn vào expectedCash của Shift nếu là Tiền mặt
        if (request.getPaymentMethod() == com.example.pizzachaongon.enums.PaymentMethod.CASH) {
            BigDecimal currentExpected = currentShift.getExpectedCash() != null
                    ? currentShift.getExpectedCash()
                    : currentShift.getStartingCash();
            currentShift.setExpectedCash(currentExpected.add(totalOrderAmount));
        }

        Order savedOrder = orderRepository.save(order);
        return mapToResponse(savedOrder);
    }

    public Page<OrderResponse> getAllOrders(String keyword, String status, Pageable pageable) {
        Page<Order> orders;
        if (status != null && !status.isEmpty()) {
            OrderStatus orderStatus = OrderStatus.valueOf(status);
            orders = orderRepository.findByStatus(orderStatus, pageable);
        } else if (keyword != null && !keyword.isEmpty()) {
            orders = orderRepository.findByOrderCodeContainingIgnoreCaseOrCustomerNameContainingIgnoreCaseOrCustomerPhoneContaining(
                    keyword, keyword, keyword, pageable);
        } else {
            orders = orderRepository.findAll(pageable);
        }
        return orders.map(this::mapToResponse);
    }

    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
        return mapToResponse(order);
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long id, OrderStatus newStatus) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
        
        order.setStatus(newStatus);
        Order savedOrder = orderRepository.save(order);
        return mapToResponse(savedOrder);
    }

    private OrderResponse mapToResponse(Order order) {
        OrderResponse res = new OrderResponse();
        res.setId(order.getId());
        res.setOrderCode(order.getOrderCode());
        res.setCustomerName(order.getCustomerName());
        res.setCustomerPhone(order.getCustomerPhone());
        res.setStatus(order.getStatus());
        res.setPaymentMethod(order.getPaymentMethod());
        res.setTotalAmount(order.getTotalAmount());
        res.setNote(order.getNote());
        res.setCreatedBy(order.getCreatedBy().getFullName());
        res.setCreatedAt(order.getCreatedAt());
        res.setQueueNumber(order.getQueueNumber());

        if (order.getItems() != null) {
            List<OrderItemResponse> itemResList = order.getItems().stream().map(item -> {
                OrderItemResponse itemRes = new OrderItemResponse();
                itemRes.setId(item.getId());
                itemRes.setProductId(item.getProductId());
                itemRes.setProductName(item.getProductName());
                itemRes.setSizeId(item.getSizeId());
                itemRes.setSizeName(item.getSizeName());
                itemRes.setQuantity(item.getQuantity());
                itemRes.setUnitPrice(item.getUnitPrice());
                itemRes.setTotalPrice(item.getTotalPrice());
                itemRes.setNote(item.getNote());

                if (item.getOptions() != null) {
                    List<OrderItemOptionResponse> optResList = item.getOptions().stream().map(opt -> {
                        OrderItemOptionResponse optRes = new OrderItemOptionResponse();
                        optRes.setId(opt.getId());
                        optRes.setOptionId(opt.getOptionId());
                        optRes.setOptionName(opt.getOptionName());
                        optRes.setPrice(opt.getPrice());
                        return optRes;
                    }).collect(Collectors.toList());
                    itemRes.setOptions(optResList);
                }
                return itemRes;
            }).collect(Collectors.toList());
            res.setItems(itemResList);
        }
        return res;
    }
}
