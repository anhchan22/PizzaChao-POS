package com.example.pizzachaongon.repository;

import com.example.pizzachaongon.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    List<ProductVariant> findByProductId(Long productId);
    java.util.Optional<ProductVariant> findByProductIdAndSizeId(Long productId, Long sizeId);
    void deleteByProductId(Long productId);
}
