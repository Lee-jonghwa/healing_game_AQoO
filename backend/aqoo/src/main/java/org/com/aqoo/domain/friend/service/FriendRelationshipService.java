package org.com.aqoo.domain.friend.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.auth.entity.User;
import org.com.aqoo.domain.friend.dto.FriendInfo;
import org.com.aqoo.domain.friend.dto.FriendRequest;
import org.com.aqoo.domain.friend.dto.FriendResponse;
import org.com.aqoo.domain.friend.entity.FriendRelationship;
import org.com.aqoo.repository.FriendRelationshipRepository;
import org.com.aqoo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendRelationshipService {

    @Autowired
    private FriendRelationshipRepository friendRelationshipRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public String createFriendRelationship(FriendRequest request) {
        // 기존 친구 관계 조회
        Optional<FriendRelationship> existingRelationship =
                friendRelationshipRepository.findFriendship(request.getUserId(), request.getFriendId());

        if (existingRelationship.isPresent()) {
            FriendRelationship relationship = existingRelationship.get();
            //이미 친구 관계인 경우
            if ("ACCEPTED".equals(relationship.getStatus())) {
                return "이미 친구 관계입니다.";
            }
            //지난 요청이 있었던 경우
            if ("PENDING".equals(relationship.getStatus())) {
                // 기존 관계 삭제
                friendRelationshipRepository.delete(relationship);
            }
        }

        // 새로운 친구 관계 저장
        FriendRelationship friendRelationship = new FriendRelationship();
        friendRelationship.setFriend1Id(request.getUserId());
        friendRelationship.setFriend2Id(request.getFriendId());
        friendRelationship.setStatus(request.getStatus());

        try {
            friendRelationshipRepository.save(friendRelationship);
            return "친구 요청이 성공적으로 전송되었습니다.";
        } catch (Exception e) {
            return "친구 요청이 실패하였습니다.";
        }
    }

    @Transactional
    public String acceptFriendRequest(Long relationshipId) {
        Optional<FriendRelationship> relationship = friendRelationshipRepository.findById(relationshipId);

        if (relationship.isPresent()) {
            FriendRelationship friendRelationship = relationship.get();
            // 상태가 이미 ACCEPTED라면, 친구 요청을 수락할 필요 없음
            if ("ACCEPTED".equals(friendRelationship.getStatus())) {
                return "이미 친구 관계입니다.";
            }
            friendRelationship.setStatus("ACCEPTED");
            friendRelationshipRepository.save(friendRelationship);
            return "친구 요청이 성공적으로 수락되었습니다.";
        }

        return "친구 요청 수락에 실패하였습니다.";
    }

    public String deleteFriendRelationship(Long relationshipId) {
        Optional<FriendRelationship> relationship = friendRelationshipRepository.findById(relationshipId);

        if (relationship.isEmpty()) {
            return "친구 삭제하기에 실패했습니다."; // 친구 관계가 존재하지 않으면 반환할 메시지
        }

        try {
            // 친구 관계 삭제
            friendRelationshipRepository.deleteById(relationshipId);
            return "친구 삭제하기에 성공했습니다.";
        } catch (Exception e) {
            return "친구 삭제하기에 실패했습니다.";
        }
    }

    public List<FriendInfo> getFriends(String userId) {
        try {
            // 친구 관계 조회
            List<FriendRelationship> friends = friendRelationshipRepository.findByFriend1IdOrFriend2IdAndStatus(userId, userId, "ACCEPTED");
            List<FriendInfo> friendDetails = new ArrayList<>();

            // 친구 정보 조회
            for (FriendRelationship friend : friends) {
                // friend1_id 또는 friend2_id에 해당하는 친구 정보를 가져옵니다.
                String friendId = friend.getFriend1Id().equals(userId) ? friend.getFriend2Id() : friend.getFriend1Id();

                Optional<User> userOpt = userRepository.findById(friendId);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    FriendInfo friendDto = new FriendInfo(
                            friend.getId(),           // 친구 관계 ID
                            user.getId(),             // 친구의 ID
                            user.getNickname(),       // 친구의 닉네임
                            user.getLevel(),          // 친구의 레벨
                            user.getMainFishImage()   // 친구의 메인 물고기 이미지
                    );
                    friendDetails.add(friendDto);
                }
            }

            return friendDetails;
        } catch (Exception e) {
            throw new RuntimeException("친구 조회하기에 실패했습니다.", e);
        }
    }


}
