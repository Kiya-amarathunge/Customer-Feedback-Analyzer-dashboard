package com.lolc.feedback.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "FEEDBACK_LINKS")
public class FeedbackLink {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "feedback_link_seq")
    @SequenceGenerator(name = "feedback_link_seq", sequenceName = "FEEDBACK_LINK_SEQ", allocationSize = 1)
    private Long id;

    // Unique token embedded in the SMS URL — customer never sees employee details
    @Column(name = "TOKEN", nullable = false, unique = true, length = 100)
    private String token;

    @Column(name = "EMPLOYEE_ID")
    private Long employeeId;

    @Column(name = "EMPLOYEE_NUMBER", length = 50)
    private String employeeNumber;

    @Column(name = "EMPLOYEE_NAME", length = 100)
    private String employeeName;

    @Column(name = "CUSTOMER_MOBILE", nullable = false, length = 20)
    private String customerMobile;

    // Used when link is triggered from external API
    @Column(name = "CUSTOMER_ID", length = 50)
    private String customerId;

    @Column(name = "BRANCH_NAME", length = 100)
    private String branchName;

    /**
     * Reference ID linking feedback to a specific loan/transaction.
     * Format: LOLC-REF-LOAN-APP-{applicationNumber}
     * Example: LOLC-REF-LOAN-APP-12345
     * Null when link is sent manually from the admin dashboard.
     */
    @Column(name = "REFERENCE_ID", length = 100)
    private String referenceId;

    // PENDING → SENT → OPENED → COMPLETED / FAILED
    @Column(name = "STATUS", nullable = false, length = 20)
    private String status;

    @Column(name = "SMS_ERROR", length = 500)
    private String smsError;

    // The actual feedback record ID once customer submits
    @Column(name = "FEEDBACK_RESPONSE_ID")
    private Long feedbackResponseId;

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;

    @Column(name = "SENT_AT")
    private LocalDateTime sentAt;

    @Column(name = "OPENED_AT")
    private LocalDateTime openedAt;

    @Column(name = "COMPLETED_AT")
    private LocalDateTime completedAt;
}
