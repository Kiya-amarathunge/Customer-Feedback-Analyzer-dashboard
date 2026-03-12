package com.lolc.feedback.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "branches")
public class Branch {

    @Id
    private String id;

    private String name;
    private String location;
    private String address;
    private String phone;
    private boolean active;
    private String qrCodeUrl;
}
