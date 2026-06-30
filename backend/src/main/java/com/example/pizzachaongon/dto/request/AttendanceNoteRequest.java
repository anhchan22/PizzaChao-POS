package com.example.pizzachaongon.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AttendanceNoteRequest {
    @Size(max = 500, message = "Ghi chú chấm công không được vượt quá 500 ký tự")
    private String attendanceNote;
}
