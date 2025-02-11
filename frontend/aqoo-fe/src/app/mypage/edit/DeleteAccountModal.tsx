import Modal from "./Modal";
import Image from "next/image";

interface DeleteAccountModalProps {
  onClose: () => void;
}

export default function DeleteAccountModal({ onClose }: DeleteAccountModalProps) {
  return (
    <Modal onClose={onClose} className="w-[600px] h-[350px] flex flex-col items-center justify-center">
      <h3 className="text-3xl font-semibold text-red-600">회원 탈퇴</h3>
      <div className="flex gap-4 m-4 items-center">
        <div
          className="
                    w-[170px] h-[170px] flex-shrink-0
                    flex items-center justify-center
                    rounded-xl border border-black bg-white
                    [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset]
                  "
        >
          {/* 실제 초상화 */}
          <div
            className="
                      w-[150px] h-[150px] flex-shrink-0
                      flex items-center justify-center
                      border border-black bg-white
                      [box-shadow:1px_1px_0px_1px_rgba(0,0,0,0.25)_inset]
                    "
          >
            <Image
              src="/images/대표이미지샘플.png"
              alt="대표 이미지"
              width={130}
              height={130}
              style={{ objectFit: "cover" }}
            />
          </div>
        </div>
        <p className="text-gray-600">
          어항 속 친구들이 벌써부터 보고싶어해요... 🐠 <br />
          조금 더 우리와 함께 헤엄쳐요, 네? 🌊 <br />
          헤엄치던 물고기들이 슬퍼할 거예요... 🐟💧
        </p>
      </div>
      <div className="flex justify-end m-4 gap-5">
        <button className="px-4 py-2 bg-gray-300 rounded mr-2 w-[200px]" onClick={onClose}>
          다시 한 번 생각한다.
        </button>
        <button className="px-4 py-2 bg-red-600 text-white rounded w-[200px]">차갑게 떠난다.</button>
      </div>
    </Modal>
  );
}
