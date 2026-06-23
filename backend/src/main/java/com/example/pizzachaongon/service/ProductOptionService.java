package com.example.pizzachaongon.service;

import com.example.pizzachaongon.dto.request.OptionRequest;
import com.example.pizzachaongon.dto.response.ProductOptionResponse;
import com.example.pizzachaongon.entity.ProductOption;
import com.example.pizzachaongon.exception.ResourceNotFoundException;
import com.example.pizzachaongon.repository.ProductOptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductOptionService {

    private final ProductOptionRepository repository;

    @Transactional(readOnly = true)
    public List<ProductOptionResponse> getAllOptions() {
        return repository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductOptionResponse createOption(OptionRequest request) {
        ProductOption option = new ProductOption();
        option.setName(request.getName());
        option.setPrice(request.getPrice());
        option.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        return mapToResponse(repository.save(option));
    }

    @Transactional
    public ProductOptionResponse updateOption(Long id, OptionRequest request) {
        ProductOption option = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Option not found with id: " + id));
        option.setName(request.getName());
        if (request.getPrice() != null) option.setPrice(request.getPrice());
        if (request.getIsActive() != null) option.setIsActive(request.getIsActive());
        return mapToResponse(repository.save(option));
    }

    @Transactional
    public void deleteOption(Long id) {
        repository.deleteById(id);
    }

    private ProductOptionResponse mapToResponse(ProductOption option) {
        ProductOptionResponse response = new ProductOptionResponse();
        response.setId(option.getId());
        response.setName(option.getName());
        response.setPrice(option.getPrice());
        response.setIsActive(option.getIsActive());
        response.setCreatedAt(option.getCreatedAt());
        response.setUpdatedAt(option.getUpdatedAt());
        return response;
    }
}
