package org.com.aqoo.domain.fish.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class FishTicketResponse {
    private String userId;
    private int fishTicket;
}
