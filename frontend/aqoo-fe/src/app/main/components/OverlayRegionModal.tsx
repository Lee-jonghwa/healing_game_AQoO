export type RegionOption = 1 | 2 | 3 | 4 | 5;

interface OverlayRegionModalProps {
  onSelect: (region: RegionOption) => void;
  onCancel: () => void;
}

export default function OverlayRegionModal({
  onSelect,
  onCancel,
}: OverlayRegionModalProps) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
      <div className='relative w-80 h-80 bg-white rounded shadow-lg p-4'>
        <h2 className='text-center text-lg font-bold mb-4'>
          어디에 표시할까요?
        </h2>
        <div className='relative w-full h-full border border-gray-400'>
          {/* 전체: 클릭 시 1 */}
          <div
            className='absolute inset-0 hover:bg-blue-200 opacity-50 cursor-pointer'
            onClick={() => onSelect(1)}
          ></div>
          {/* 왼쪽 절반: 클릭 시 2 */}
          <div
            className='absolute top-0 left-0 w-1/2 h-full hover:bg-green-200 opacity-50 cursor-pointer'
            onClick={(e) => {
              e.stopPropagation();
              onSelect(2);
            }}
          ></div>
          {/* 오른쪽 절반: 클릭 시 3 */}
          <div
            className='absolute top-0 right-0 w-1/2 h-full hover:bg-red-200 opacity-50 cursor-pointer'
            onClick={(e) => {
              e.stopPropagation();
              onSelect(3);
            }}
          ></div>
          {/* 위쪽 절반: 클릭 시 4 */}
          <div
            className='absolute top-0 left-0 w-full h-1/2 hover:bg-yellow-200 opacity-50 cursor-pointer'
            onClick={(e) => {
              e.stopPropagation();
              onSelect(4);
            }}
          ></div>
          {/* 아래쪽 절반: 클릭 시 5 */}
          <div
            className='absolute bottom-0 left-0 w-full h-1/2 hover:bg-purple-200 opacity-50 cursor-pointer'
            onClick={(e) => {
              e.stopPropagation();
              onSelect(5);
            }}
          ></div>
        </div>
        <button
          className='absolute top-2 right-2 text-sm text-gray-600'
          onClick={onCancel}
        >
          닫기
        </button>
      </div>
    </div>
  );
}
