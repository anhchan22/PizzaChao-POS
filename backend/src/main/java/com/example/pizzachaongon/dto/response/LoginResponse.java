package com.example.pizzachaongon.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponse {
    private String accessToken;
    private String tokenType;
    private UserResponse user;

    public static LoginResponse of(String token, UserResponse user) {
        return LoginResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .user(user)
                .build();
    }
}
