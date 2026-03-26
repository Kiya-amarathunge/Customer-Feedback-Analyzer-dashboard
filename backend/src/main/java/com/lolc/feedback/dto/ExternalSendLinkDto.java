package com.lolc.feedback.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ExternalSendLinkDto {

    @NotBlank(message = "Customer ID is required")
    private String customerId;

    @NotBlank(message = "Employee ID is required")
    private String employeeId;

    @NotBlank(message = "Customer mobile is required")
    private String customerMobile;

    /**
     * Reference ID to identify the specific loan or transaction.
     * Format: LOLC-REF-LOAN-APP-{applicationNumber}
     * Example: LOLC-REF-LOAN-APP-12345
     * Optional — if not provided, stored as null.
     */
    private String referenceId;
}
