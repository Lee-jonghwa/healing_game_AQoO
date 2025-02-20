// page.tsx
import { Suspense } from 'react';
import SocialLoginCallbackClient from '@/app/user/login/social-login-callback/SocialLoginCallbackClient';

export default function SocialLoginCallbackPage() {
  return (
    <Suspense fallback={<div>로그인 중입니다...</div>}>
      <SocialLoginCallbackClient />
    </Suspense>
  );
}

