package com.example.pizzachaongon.dto.request;

import com.example.pizzachaongon.enums.UserStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateUserStatusRequest {

    @NotNull(message = "Trạng thái không được để trống")
    private UserStatus status;
}
