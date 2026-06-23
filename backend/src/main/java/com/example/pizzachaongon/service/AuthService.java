package com.example.pizzachaongon.service;

import com.example.pizzachaongon.dto.request.ChangePasswordRequest;
import com.example.pizzachaongon.dto.request.LoginRequest;
import com.example.pizzachaongon.dto.response.LoginResponse;
import com.example.pizzachaongon.entity.User;
import com.example.pizzachaongon.enums.UserStatus;
import com.example.pizzachaongon.exception.BadRequestException;
import com.example.pizzachaongon.exception.ResourceNotFoundException;
import com.example.pizzachaongon.mapper.UserMapper;
import com.example.pizzachaongon.repository.UserRepository;
import com.example.pizzachaongon.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest request) {
        // Check user existence and status first for better error message
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Tên đăng nhập hoặc mật khẩu không đúng"));

        if (user.getStatus() == UserStatus.INACTIVE) {
            throw new LockedException("Tài khoản đã bị khóa. Vui lòng liên hệ quản lý");
        }

        // Authenticate
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        String token = jwtService.generateToken(user);
        return LoginResponse.of(token, userMapper.toResponse(user));
    }

    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Mật khẩu hiện tại không đúng");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
