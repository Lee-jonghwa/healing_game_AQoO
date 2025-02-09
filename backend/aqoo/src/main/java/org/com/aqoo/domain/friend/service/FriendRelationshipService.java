package org.com.aqoo.domain.friend.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.com.aqoo.domain.auth.entity.User;
import org.com.aqoo.domain.friend.dto.FriendInfo;
import org.com.aqoo.domain.friend.dto.FriendRequest;
import org.com.aqoo.domain.friend.dto.FindResponse;
import org.com.aqoo.domain.friend.entity.FriendRelationship;
import org.com.aqoo.domain.notification.dto.NotificationRequest;
import org.com.aqoo.domain.notification.service.NotificationService;
import org.com.aqoo.domain.push.dto.PushRequest;
import org.com.aqoo.domain.push.service.PushService;
import org.com.aqoo.repository.FriendRelationshipRepository;
import org.com.aqoo.repository.UserRepository;
import org.com.aqoo.util.ImageUrlUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendRelationshipService {

    @Autowired
    private FriendRelationshipRepository friendRelationshipRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ImageUrlUtils imageUtils;

    @Autowired
    private PushService pushService;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public Map<String, Integer> createFriendRelationship(FriendRequest request) throws Exception {
        User user = userRepository.findById(request.getFriendId())
                .orElseThrow(() -> new IllegalArgumentException("친구가 존재하지 않습니다."));

        // 기존 친구 관계 조회
        Optional<FriendRelationship> existingRelationship = checkFriendship(request.getUserId(), request.getFriendId());

        if (existingRelationship.isPresent()) {
            FriendRelationship relationship = existingRelationship.get();
            // 이미 친구 관계인 경우
            if ("ACCEPTED".equals(relationship.getStatus())) {
                throw new IllegalStateException("이미 친구 관계입니다.");
            }
            // 지난 요청이 있었던 경우
            if ("PENDING".equals(relationship.getStatus())) {
                // 기존 관계 삭제
                friendRelationshipRepository.delete(relationship);
            }
        }

        // 새로운 친구 관계 저장
        FriendRelationship friendRelationship = new FriendRelationship();
        friendRelationship.setFriend1Id(request.getUserId());
        friendRelationship.setFriend2Id(request.getFriendId());
        friendRelationship.setStatus("PENDING"); // 친구 요청 상태로 설정

        //db에 친구 관계 저장
        friendRelationship = friendRelationshipRepository.save(friendRelationship);

        //친구 요청 알람 보내기
        String type = "FRIEND REQUEST";
        String title = "친구 요청 알람";
        String message = request.getFriendId() + "님께서 친구요청을 보냈습니다.";

        PushRequest pushRequest =
                new PushRequest(type, title, message);
        pushService.sendPush(request.getUserId(), pushRequest);

        //친구 요청 알람 저장
        NotificationRequest notification =
                new NotificationRequest(request.getFriendId(), type, friendRelationship.getId(),
                        message);
        notificationService.createNotification(notification);

        // 결과를 Map으로 변환하여 반환
        Map<String, Integer> response = new HashMap<>();
        response.put("relationshipId", friendRelationship.getId());
        return response;
    }

    @Transactional
    public String acceptFriendRequest(int relationshipId) throws Exception {
        Optional<FriendRelationship> relationship = friendRelationshipRepository.findById(relationshipId);

        if (relationship.isPresent()) {
            FriendRelationship friendRelationship = relationship.get();
            // 상태가 이미 ACCEPTED라면, 친구 요청을 수락할 필요 없음
            if ("ACCEPTED".equals(friendRelationship.getStatus())) {
                return "이미 친구 관계입니다.";
            }
            friendRelationship.setStatus("ACCEPTED");
            friendRelationshipRepository.save(friendRelationship);

            String sender = userRepository.findById(friendRelationship.getFriend1Id()).get().getId();
            String recipient = userRepository.findById(friendRelationship.getFriend2Id()).get().getId();

            //친구 수락 알람
            String type = "FRIEND ACCEPT";
            String title = "친구 수락 알람";
            String message = recipient + "님께서 친구요청을 수락했습니다.";

            PushRequest pushRequest =
                    new PushRequest(type, title, message);
            pushService.sendPush(sender, pushRequest);

            //친구 수락 알람 저장
            NotificationRequest notification =
                    new NotificationRequest(sender, type, friendRelationship.getId(),
                            message);
            notificationService.createNotification(notification);

            return "친구 요청이 성공적으로 수락되었습니다.";
        }

        return "친구 요청 수락에 실패하였습니다.";
    }

    public String deleteFriendRelationship(int relationshipId) {
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

    public List<FriendInfo> getFriendList(String userId) {
        try {
            // 친구 관계 조회
            List<FriendRelationship> friends = friendRelationshipRepository.findByFriend1IdOrFriend2IdAndStatus(userId, "ACCEPTED");
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
                            imageUtils.toAbsoluteUrl(user.getMainFishImage())   // 친구의 메인 물고기 이미지
                    );
                    friendDetails.add(friendDto);
                }
            }

            return friendDetails;
        } catch (Exception e) {
            throw new RuntimeException("친구 조회하기에 실패했습니다.", e);
        }
    }

    public List<FindResponse> findUsers(String userId, String keyword) {
        List<User> foundUsers = userRepository.findByIdContainingIgnoreCase(keyword); // 'id'에 keyword 포함된 사용자 조회

        // 검색 결과에서 자신을 제외
        foundUsers = foundUsers.stream()
                .filter(user -> !user.getId().equals(userId)) // userId와 일치하는 사용자 제외
                .toList();

        if (foundUsers.isEmpty()) {
            return Collections.emptyList();
        }

        // 친구 관계 확인
        List<FindResponse> responseList = new ArrayList<>();
        for (User user : foundUsers) {

            Optional<FriendRelationship> existingRelationship = checkFriendship(userId, user.getId());

            boolean isFriend = false;

            if(existingRelationship.isPresent()
                    && "ACCEPTED".equals(existingRelationship.get().getStatus())
            ) isFriend = true;

            FindResponse response = new FindResponse(
                    userId,
                    user.getId(),
                    isFriend ? 1 : 0,
                    user.getNickname(),
                    user.getLevel(),
                    imageUtils.toAbsoluteUrl(user.getMainFishImage())
            );
            responseList.add(response);
        }

        return responseList;
    }

    private Optional<FriendRelationship> checkFriendship(String userId, String friendId) {
        Optional<FriendRelationship> existingRelationship =
                friendRelationshipRepository.findFriendship(userId, friendId);
        return existingRelationship;
    }


}
