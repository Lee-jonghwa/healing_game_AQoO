'use client';
// 파일: app/user/find-password/reset/page.tsx

import InputField from '@/app/user/find-password/components/InputField';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

interface ResetPasswordFormInputs {
  newPassword: string;
  confirmPassword: string;
}

// 내부 컴포넌트: useSearchParams()를 사용하여 userId를 가져옵니다.
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 쿼리 파라미터로 전달된 userId (없으면 빈 문자열)
  const userId = searchParams.get('userId') || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormInputs>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onSubmit: SubmitHandler<ResetPasswordFormInputs> = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      alert('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    setIsLoading(true);
    try {
      const API_BASE_URL = 'https://i12e203.p.ssafy.io/api/v1';
      // POST /auth/new-password 요청
      const response = await axios.post(`${API_BASE_URL}/auth/new-password`, {
        userId,
        newPassword: data.newPassword,
      });
      console.log('비밀번호 재설정 성공:', response.data);
      // 재설정 성공 후 로그인 페이지 등 원하는 페이지로 이동
      router.push('/user/login');
    } catch (error) {
      console.error('비밀번호 재설정 실패', error);
      // 에러 처리 및 사용자 안내 추가 가능
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className='flex justify-center items-center min-h-screen bg-cover bg-center'
      style={{
        backgroundImage: "url('https://i12e203.p.ssafy.io/images/bg1.png')",
      }}
    >
      <div className='relative bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-96 border-t-4 border-blue-500'>
        <button
          onClick={() => router.back()}
          className='absolute top-4 left-4 text-blue-500 hover:underline'
        >
          뒤로가기
        </button>
        <h2 className='text-center text-3xl font-bold text-blue-900 mb-6'>
          비밀번호 재설정
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          <InputField
            label='새 비밀번호'
            type='password'
            placeholder='새 비밀번호 입력'
            {...register('newPassword', {
              required: '새 비밀번호는 필수 입력 항목입니다.',
            })}
            error={errors.newPassword?.message as string}
          />
          <InputField
            label='비밀번호 확인'
            type='password'
            placeholder='비밀번호 확인 입력'
            {...register('confirmPassword', {
              required: '비밀번호 확인은 필수 입력 항목입니다.',
            })}
            error={errors.confirmPassword?.message as string}
          />
          <button
            type='submit'
            disabled={isLoading}
            className='w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-indigo-400 text-white font-semibold rounded-lg shadow-md hover:from-purple-600 hover:to-indigo-500 transition'
          >
            {isLoading ? '로딩중...' : '비밀번호 재설정'}
          </button>
        </form>
      </div>
    </div>
  );
}

// 최상위 페이지 컴포넌트는 Suspense로 ResetPasswordContent를 감쌉니다.
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
