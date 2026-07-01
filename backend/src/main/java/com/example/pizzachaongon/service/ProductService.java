package com.example.pizzachaongon.service;

import com.example.pizzachaongon.dto.request.ProductRequest;
import com.example.pizzachaongon.dto.response.*;
import com.example.pizzachaongon.entity.*;
import com.example.pizzachaongon.enums.OrderStatus;
import com.example.pizzachaongon.enums.ProductStatus;
import com.example.pizzachaongon.exception.ResourceNotFoundException;
import com.example.pizzachaongon.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductCategoryRepository categoryRepository;
    private final SizeRepository sizeRepository;
    private final ProductVariantRepository variantRepository;
    private final OrderItemRepository orderItemRepository;

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        List<Product> products = productRepository.findAll();
        Map<Long, Long> soldQuantityByProductId = getSoldQuantityByProductId(products);

        return products.stream()
                .map(product -> mapToResponse(product, soldQuantityByProductId.getOrDefault(product.getId(), 0L)))
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        ProductCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        Product product = new Product();
        product.setCategory(category);
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setImageUrl(request.getImageUrl());
        product.setStatus(request.getStatus() != null ? request.getStatus() : ProductStatus.ACTIVE);
        product.setBasePrice(request.getBasePrice());

        product = productRepository.save(product);

        if (request.getVariants() != null) {
            for (ProductRequest.VariantRequest vr : request.getVariants()) {
                Size size = sizeRepository.findById(vr.getSizeId())
                        .orElseThrow(() -> new ResourceNotFoundException("Size not found"));
                ProductVariant variant = new ProductVariant();
                variant.setProduct(product);
                variant.setSize(size);
                variant.setPrice(vr.getPrice());
                variantRepository.save(variant);
            }
        }

        return mapToResponse(product, 0L);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (!product.getCategory().getId().equals(request.getCategoryId())) {
            ProductCategory category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            product.setCategory(category);
        }

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setImageUrl(request.getImageUrl());
        if (request.getStatus() != null) product.setStatus(request.getStatus());
        if (request.getBasePrice() != null) product.setBasePrice(request.getBasePrice());

        product = productRepository.save(product);

        // Update variants (simple strategy: delete all and recreate)
        variantRepository.deleteByProductId(product.getId());
        if (request.getVariants() != null) {
            for (ProductRequest.VariantRequest vr : request.getVariants()) {
                Size size = sizeRepository.findById(vr.getSizeId())
                        .orElseThrow(() -> new ResourceNotFoundException("Size not found"));
                ProductVariant variant = new ProductVariant();
                variant.setProduct(product);
                variant.setSize(size);
                variant.setPrice(vr.getPrice());
                variantRepository.save(variant);
            }
        }

        Long soldQuantity = getSoldQuantityByProductId(List.of(product)).getOrDefault(product.getId(), 0L);
        return mapToResponse(product, soldQuantity);
    }

    @Transactional
    public void deleteProduct(Long id) {
        variantRepository.deleteByProductId(id);
        productRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<PosCategoryResponse> getPosData() {
        List<ProductCategory> categories = categoryRepository.findAll();
        return categories.stream().filter(ProductCategory::getIsActive).map(category -> {
            PosCategoryResponse response = new PosCategoryResponse();
            response.setId(category.getId());
            response.setName(category.getName());
            response.setSortOrder(category.getSortOrder());

            List<Product> products = productRepository.findByCategoryId(category.getId());
            List<PosProductResponse> productResponses = products.stream()
                    .filter(p -> p.getStatus() != ProductStatus.INACTIVE)
                    .map(this::mapToPosProductResponse)
                    .collect(Collectors.toList());

            response.setProducts(productResponses);
            return response;
        }).collect(Collectors.toList());
    }

    private ProductResponse mapToResponse(Product product, Long soldQuantity) {
        ProductResponse response = new ProductResponse();
        response.setId(product.getId());
        
        ProductCategoryResponse catResp = new ProductCategoryResponse();
        catResp.setId(product.getCategory().getId());
        catResp.setName(product.getCategory().getName());
        response.setCategory(catResp);

        response.setName(product.getName());
        response.setDescription(product.getDescription());
        response.setImageUrl(product.getImageUrl());
        response.setStatus(product.getStatus());
        response.setBasePrice(product.getBasePrice());
        response.setSoldQuantity(soldQuantity);
        response.setCreatedAt(product.getCreatedAt());
        response.setUpdatedAt(product.getUpdatedAt());

        List<ProductVariant> variants = variantRepository.findByProductId(product.getId());
        List<ProductVariantResponse> variantResponses = variants.stream().map(v -> {
            ProductVariantResponse vr = new ProductVariantResponse();
            vr.setId(v.getId());
            SizeResponse sr = new SizeResponse();
            sr.setId(v.getSize().getId());
            sr.setName(v.getSize().getName());
            vr.setSize(sr);
            vr.setPrice(v.getPrice());
            return vr;
        }).collect(Collectors.toList());
        response.setVariants(variantResponses);

        return response;
    }

    private Map<Long, Long> getSoldQuantityByProductId(List<Product> products) {
        List<Long> productIds = products.stream()
                .map(Product::getId)
                .filter(id -> id != null)
                .collect(Collectors.toList());

        Map<Long, Long> result = new HashMap<>();
        if (productIds.isEmpty()) {
            return result;
        }

        for (Object[] row : orderItemRepository.sumSoldQuantityByProductIds(productIds, List.of(OrderStatus.CANCELLED))) {
            Long productId = (Long) row[0];
            Number soldQuantity = (Number) row[1];
            result.put(productId, soldQuantity.longValue());
        }

        return result;
    }

    private PosProductResponse mapToPosProductResponse(Product product) {
        PosProductResponse response = new PosProductResponse();
        response.setId(product.getId());
        response.setName(product.getName());
        response.setDescription(product.getDescription());
        response.setImageUrl(product.getImageUrl());
        response.setStatus(product.getStatus());
        response.setBasePrice(product.getBasePrice());

        List<ProductVariant> variants = variantRepository.findByProductId(product.getId());
        List<ProductVariantResponse> variantResponses = variants.stream().map(v -> {
            ProductVariantResponse vr = new ProductVariantResponse();
            vr.setId(v.getId());
            SizeResponse sr = new SizeResponse();
            sr.setId(v.getSize().getId());
            sr.setName(v.getSize().getName());
            vr.setSize(sr);
            vr.setPrice(v.getPrice());
            return vr;
        }).collect(Collectors.toList());
        response.setVariants(variantResponses);

        return response;
    }
}
