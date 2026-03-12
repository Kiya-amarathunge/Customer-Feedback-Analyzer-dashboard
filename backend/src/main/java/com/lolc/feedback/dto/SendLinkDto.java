package com.lolc.feedback.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendLinkDto {
    @NotBlank(message = "Employee number is required")
    private String employeeNumber;

    @NotBlank(message = "Customer mobile is required")
    private String customerMobile;
}

