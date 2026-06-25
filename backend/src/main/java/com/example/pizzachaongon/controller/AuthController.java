package com.example.pizzachaongon.controller;

import com.example.pizzachaongon.dto.request.ChangePasswordRequest;
import com.example.pizzachaongon.dto.request.LoginRequest;
import com.example.pizzachaongon.dto.response.ApiResponse;
import com.example.pizzachaongon.dto.response.LoginResponse;
import com.example.pizzachaongon.dto.response.UserResponse;
import com.example.pizzachaongon.mapper.UserMapper;
import com.example.pizzachaongon.repository.UserRepository;
import com.example.pizzachaongon.service.AuthService;
import com.example.pizzachaongon.service.ShiftService;
import com.example.pizzachaongon.exception.BadRequestException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final ShiftService shiftService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        if (shiftService.getCurrentShift() != null) {
            throw new BadRequestException("Bạn phải đóng ca làm việc trước khi đăng xuất.");
        }
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> me(@AuthenticationPrincipal UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername())
                .map(user -> ResponseEntity.ok(ApiResponse.success(userMapper.toResponse(user))))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công", null));
    }
}
