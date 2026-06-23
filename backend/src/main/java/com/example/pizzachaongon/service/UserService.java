package com.example.pizzachaongon.service;

import com.example.pizzachaongon.dto.request.CreateUserRequest;
import com.example.pizzachaongon.dto.request.ResetPasswordRequest;
import com.example.pizzachaongon.dto.request.UpdateUserRequest;
import com.example.pizzachaongon.dto.request.UpdateUserStatusRequest;
import com.example.pizzachaongon.dto.response.UserResponse;
import com.example.pizzachaongon.entity.User;
import com.example.pizzachaongon.enums.UserRole;
import com.example.pizzachaongon.enums.UserStatus;
import com.example.pizzachaongon.exception.BadRequestException;
import com.example.pizzachaongon.exception.ResourceNotFoundException;
import com.example.pizzachaongon.mapper.UserMapper;
import com.example.pizzachaongon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public List<UserResponse> getAll(String roleStr, String statusStr, String keyword) {
        UserRole role = (StringUtils.hasText(roleStr)) ? UserRole.valueOf(roleStr.toUpperCase()) : null;
        UserStatus status = (StringUtils.hasText(statusStr)) ? UserStatus.valueOf(statusStr.toUpperCase()) : null;
        String kw = StringUtils.hasText(keyword) ? keyword.trim() : null;

        return userRepository.findAllWithFilters(role, status, kw)
                .stream()
                .map(userMapper::toResponse)
                .toList();
    }

    public UserResponse getById(Long id) {
        return userMapper.toResponse(findById(id));
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Tên đăng nhập '" + request.getUsername() + "' đã tồn tại");
        }

        User user = User.builder()
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(request.getRole())
                .status(UserStatus.ACTIVE)
                .build();

        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse update(Long id, UpdateUserRequest request) {
        User user = findById(id);

        if (StringUtils.hasText(request.getFullName())) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateStatus(Long id, UpdateUserStatusRequest request) {
        User user = findById(id);

        if (user.getRole() == UserRole.OWNER) {
            throw new BadRequestException("Không thể thay đổi trạng thái tài khoản chủ cửa hàng");
        }

        user.setStatus(request.getStatus());
        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    public void resetPassword(Long id, ResetPasswordRequest request) {
        User user = findById(id);
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với id: " + id));
    }

    public User getCurrentUser() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            throw new com.example.pizzachaongon.exception.BadRequestException("Người dùng chưa đăng nhập");
        }
        String username = auth.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng hiện tại"));
    }
}
