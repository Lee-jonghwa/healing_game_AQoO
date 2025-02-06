package org.com.aqoo.domain.game.entity;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class GameRoom {

    private String roomId;
    private boolean gameStarted;
    private List<Player> players = new ArrayList<>();

    public GameRoom(String roomId, boolean gameStarted) {
        this.roomId = roomId;
        this.gameStarted = gameStarted;
    }

    public void addPlayer(Player player) {
        players.add(player);
    }
}