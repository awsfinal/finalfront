import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function AuthSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing'); // processing, success, error

  useEffect(() => {
    const handleCognitoCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // 오류가 있는 경우
      if (error) {
        console.error('OAuth 오류:', error, errorDescription);
        setStatus('error');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
        return;
      }

      // 인증 코드가 있는 경우
      if (code) {
        try {
          console.log('🔑 Cognito 인증 코드 수신:', code);
          
          // Cognito 토큰 엔드포인트에 직접 요청
          const tokenUrl = 'https://ap-northeast-1kiuompokk.auth.ap-northeast-1.amazoncognito.com/oauth2/token';
          
          const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: '3ek1pv9mpd8rdvm281nllq3ctl',
            code: code,
            redirect_uri: 'https://www.jjikgeo.com/auth/success'
          });

          const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
          });

          if (!response.ok) {
            const errorData = await response.text();
            console.error('토큰 교환 실패:', errorData);
            throw new Error(`토큰 교환 실패: ${response.status}`);
          }

          const tokens = await response.json();
          console.log('✅ 토큰 교환 성공');
          
          // ID Token에서 사용자 정보 추출
          if (tokens.id_token) {
            try {
              // JWT 디코딩 (간단한 방법)
              const base64Url = tokens.id_token.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));
              
              const payload = JSON.parse(jsonPayload);
              
              // 사용자 정보 구성
              const userInfo = {
                id: payload.sub,
                email: payload.email,
                name: payload.name || payload.given_name || payload.email,
                given_name: payload.given_name,
                family_name: payload.family_name,
                picture: payload.picture,
                email_verified: payload.email_verified,
                provider: 'cognito-google'
              };

              // 로컬 스토리지에 저장
              localStorage.setItem('authToken', tokens.access_token);
              localStorage.setItem('user', JSON.stringify(userInfo));
              localStorage.setItem('cognitoTokens', JSON.stringify(tokens));

              console.log('✅ Cognito OAuth 로그인 성공:', userInfo.email);
              console.log('👤 사용자 정보:', userInfo);
              setStatus('success');

              // 2초 후 메인 페이지로 이동
              setTimeout(() => {
                navigate('/main');
              }, 2000);

            } catch (tokenError) {
              console.error('ID Token 파싱 오류:', tokenError);
              throw new Error('사용자 정보 추출 실패');
            }
          } else {
            throw new Error('ID Token이 없습니다');
          }

        } catch (error) {
          console.error('Cognito 콜백 처리 오류:', error);
          setStatus('error');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } else {
        console.error('인증 코드가 없습니다');
        setStatus('error');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleCognitoCallback();
  }, [searchParams, navigate]);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        {status === 'processing' && (
          <>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #4CAF50',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <h2 style={{ color: '#333', marginBottom: '10px' }}>로그인 처리 중...</h2>
            <p style={{ color: '#666' }}>Cognito 인증을 완료하고 있습니다.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: '50px',
              height: '50px',
              backgroundColor: '#4CAF50',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'white',
              fontSize: '24px'
            }}>
              ✓
            </div>
            <h2 style={{ color: '#4CAF50', marginBottom: '10px' }}>로그인 성공!</h2>
            <p style={{ color: '#666' }}>찍고갈래에 오신 것을 환영합니다!</p>
            <p style={{ color: '#999', fontSize: '14px' }}>메인 페이지로 이동합니다...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: '50px',
              height: '50px',
              backgroundColor: '#f44336',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'white',
              fontSize: '24px'
            }}>
              ✗
            </div>
            <h2 style={{ color: '#f44336', marginBottom: '10px' }}>로그인 실패</h2>
            <p style={{ color: '#666' }}>인증 중 오류가 발생했습니다.</p>
            <p style={{ color: '#999', fontSize: '14px' }}>로그인 페이지로 돌아갑니다...</p>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default AuthSuccessPage;
