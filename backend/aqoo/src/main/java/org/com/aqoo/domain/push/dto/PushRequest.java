package org.com.aqoo.domain.push.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PushRequest {
    private String type;
    private String title;
    private String body;
}
