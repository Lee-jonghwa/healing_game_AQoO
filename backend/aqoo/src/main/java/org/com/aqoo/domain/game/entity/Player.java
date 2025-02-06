package org.com.aqoo.domain.game.entity;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Player {

    private String userName;
    private int totalPressCount;

    public Player(String userName, int totalPressCount) {
        this.userName = userName;
        this.totalPressCount = totalPressCount;
    }

    public void addPressCount(int count) {
        this.totalPressCount += count;
    }
}