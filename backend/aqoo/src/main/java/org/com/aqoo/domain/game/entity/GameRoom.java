package org.com.aqoo.domain.game.entity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class GameRoom {

    private String roomId;
    private boolean gameStarted;
    private List<Player> players = new ArrayList<>();

}