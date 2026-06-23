package com.example.pizzachaongon.service;

import com.example.pizzachaongon.dto.request.CategoryRequest;
import com.example.pizzachaongon.dto.response.ProductCategoryResponse;
import com.example.pizzachaongon.entity.ProductCategory;
import com.example.pizzachaongon.exception.ResourceNotFoundException;
import com.example.pizzachaongon.repository.ProductCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductCategoryService {

    private final ProductCategoryRepository repository;

    @Transactional(readOnly = true)
    public List<ProductCategoryResponse> getAllCategories() {
        return repository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductCategoryResponse createCategory(CategoryRequest request) {
        ProductCategory category = new ProductCategory();
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        category.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        return mapToResponse(repository.save(category));
    }

    @Transactional
    public ProductCategoryResponse updateCategory(Long id, CategoryRequest request) {
        ProductCategory category = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        if (request.getSortOrder() != null) category.setSortOrder(request.getSortOrder());
        if (request.getIsActive() != null) category.setIsActive(request.getIsActive());
        return mapToResponse(repository.save(category));
    }

    @Transactional
    public void deleteCategory(Long id) {
        repository.deleteById(id);
    }

    private ProductCategoryResponse mapToResponse(ProductCategory category) {
        ProductCategoryResponse response = new ProductCategoryResponse();
        response.setId(category.getId());
        response.setName(category.getName());
        response.setDescription(category.getDescription());
        response.setSortOrder(category.getSortOrder());
        response.setIsActive(category.getIsActive());
        response.setCreatedAt(category.getCreatedAt());
        response.setUpdatedAt(category.getUpdatedAt());
        return response;
    }
}
