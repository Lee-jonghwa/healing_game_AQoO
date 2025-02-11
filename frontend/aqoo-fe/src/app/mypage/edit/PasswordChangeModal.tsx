import Modal from "./Modal";
import InputField from "./InputField";

interface PasswordChangeModalProps {
  onClose: () => void;
}

export default function PasswordChangeModal({ onClose }: PasswordChangeModalProps) {
  return (
    <Modal onClose={onClose} className="w-[400px] h-[450px] p-6">
      <h3 className="text-3xl font-semibold mb-4">비밀번호 변경</h3>
      <div className="space-y-4">
        <InputField label="현재 비밀번호" type="password" placeholder="현재 비밀번호" variant="static" />
        <InputField label="새 비밀번호" type="password" placeholder="새 비밀번호" variant="dynamic" />
        <InputField label="새 비밀번호 확인" type="password" placeholder="새 비밀번호 확인" variant="dynamic" />
      </div>
      <div className="flex justify-end mt-6">
        <button className="px-4 py-2 bg-gray-300 rounded mr-2" onClick={onClose}>
          취소
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded">변경하기</button>
      </div>
    </Modal>
  );
}
