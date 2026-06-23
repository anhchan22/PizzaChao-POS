package com.example.pizzachaongon.service;

import com.example.pizzachaongon.dto.request.SizeRequest;
import com.example.pizzachaongon.dto.response.SizeResponse;
import com.example.pizzachaongon.entity.Size;
import com.example.pizzachaongon.exception.ResourceNotFoundException;
import com.example.pizzachaongon.repository.SizeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SizeService {

    private final SizeRepository repository;

    @Transactional(readOnly = true)
    public List<SizeResponse> getAllSizes() {
        return repository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SizeResponse createSize(SizeRequest request) {
        Size size = new Size();
        size.setName(request.getName());
        size.setDescription(request.getDescription());
        return mapToResponse(repository.save(size));
    }

    @Transactional
    public SizeResponse updateSize(Long id, SizeRequest request) {
        Size size = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Size not found with id: " + id));
        size.setName(request.getName());
        size.setDescription(request.getDescription());
        return mapToResponse(repository.save(size));
    }

    @Transactional
    public void deleteSize(Long id) {
        repository.deleteById(id);
    }

    private SizeResponse mapToResponse(Size size) {
        SizeResponse response = new SizeResponse();
        response.setId(size.getId());
        response.setName(size.getName());
        response.setDescription(size.getDescription());
        response.setCreatedAt(size.getCreatedAt());
        response.setUpdatedAt(size.getUpdatedAt());
        return response;
    }
}
