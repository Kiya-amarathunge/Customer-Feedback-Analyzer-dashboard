package com.lolc.feedback.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddEmployeeDto {
    @NotBlank(message = "Employee number is required")
    private String employeeNumber;

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String email;
    private String phone;
    private Long branchId;
    private String branchName;
}
