import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { translations, getLanguage } from '../utils/translations';

function LoginPage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('ko');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const t = translations[language];

  useEffect(() => {
    const savedLanguage = getLanguage();
    setLanguage(savedLanguage);
  }, []);

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    setShowLanguageDropdown(false);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // 로그인 로직 처리
    console.log('로그인:', { email, password });
    navigate('/main');
  };

  const handleSocialLogin = async (provider) => {
    if (provider === 'Google') {
      try {
        console.log('🔑 Cognito Google OAuth 로그인 시작');
        
        // Cognito Hosted UI URL 직접 사용 (스코프를 기본 스코프로만 제한)
        const cognitoAuthUrl = 'https://ap-northeast-1kiuompokk.auth.ap-northeast-1.amazoncognito.com/oauth2/authorize?client_id=3ek1pv9mpd8rdvm281nllq3ctl&response_type=code&scope=openid+email+profile&redirect_uri=https%3A%2F%2Fwww.jjikgeo.com%2Fauth%2Fsuccess&identity_provider=Google';
        
        // Cognito OAuth 페이지로 리다이렉트
        window.location.href = cognitoAuthUrl;
        
      } catch (error) {
        console.error('Cognito 로그인 오류:', error);
        alert('로그인 중 오류가 발생했습니다.');
      }
    } else {
      console.log(`${provider} 로그인`);
      navigate('/main');
    }
  };

  return (
    <div style={{
      height: '100vh',
      backgroundColor: '#f8f9fa',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      paddingTop: '80px' // 언어 설정과 겹치지 않도록 상단 여백 추가
    }}>
      {/* 언어 선택 버튼 */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000
      }}>
        <div 
          style={{ 
            fontSize: '14px', 
            color: '#333',
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: '20px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            minWidth: '80px',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
        >
          🌐 {t.language}
        </div>
        {showLanguageDropdown && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '5px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            zIndex: 1001
          }}>
            <div
              onClick={() => handleLanguageChange('ko')}
              style={{
                padding: '10px 15px',
                cursor: 'pointer',
                backgroundColor: language === 'ko' ? '#f0f0f0' : 'white',
                fontSize: '14px'
              }}
            >
              🇰🇷 한국어
            </div>
            <div
              onClick={() => handleLanguageChange('en')}
              style={{
                padding: '10px 15px',
                cursor: 'pointer',
                backgroundColor: language === 'en' ? '#f0f0f0' : 'white',
                fontSize: '14px'
              }}
            >
              🇺🇸 English
            </div>
          </div>
        )}
      </div>

      {/* 로고 영역 - 메인화면처럼 큰 3개 이미지 */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          justifyContent: 'center',
          maxWidth: '350px',
          margin: '0 auto'
        }}>
          <img 
            src="/image/banner_building.png" 
            alt="건물"
            style={{ 
              flex: 1,
              height: '100px',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />
          <img 
            src="/image/banner_logo.png" 
            alt="찍지오"
            style={{ 
              flex: 1,
              height: '100px',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />
          <img 
            src="/image/banner_person.png" 
            alt="사람"
            style={{ 
              flex: 1,
              height: '100px',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />
        </div>
      </div>

      {/* 로그인 폼 - 라운드 탭 */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '40px 30px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef'
      }}>
        <form onSubmit={handleLogin}>
          {/* ID 입력란 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              {language === 'ko' ? '아이디' : 'ID'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={language === 'ko' ? '이메일을 입력하세요' : 'Enter your email'}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '12px',
                border: '2px solid #e9ecef',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007AFF'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
          </div>

          {/* PW 입력란 */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              {language === 'ko' ? '비밀번호' : 'Password'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={language === 'ko' ? '비밀번호를 입력하세요' : 'Enter your password'}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '12px',
                border: '2px solid #e9ecef',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007AFF'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#007AFF',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '30px',
              transition: 'background-color 0.3s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#0056CC'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#007AFF'}
          >
            {language === 'ko' ? '로그인' : 'Login'}
          </button>

          {/* 소셜 로그인 */}
          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontSize: '14px',
              color: '#666',
              marginBottom: '20px'
            }}>
              {language === 'ko' ? '또는 소셜 계정으로 로그인' : 'Or login with social account'}
            </p>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '20px'
            }}>
              {/* 네이버 로그인 */}
              <div
                onClick={() => handleSocialLogin('Naver')}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#03C75A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  boxShadow: '0 4px 12px rgba(3, 199, 90, 0.3)'
                }}
                onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
              >
                <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>N</span>
              </div>

              {/* 구글 로그인 */}
              <div
                onClick={() => handleSocialLogin('Google')}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  border: '2px solid #e9ecef',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
              >
                <img 
                  src="/image/google_icon.png" 
                  alt="Google"
                  style={{ width: '24px', height: '24px' }}
                />
              </div>
            </div>
          </div>
        </form>

        {/* 회원가입 링크 */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid #e9ecef'
        }}>
          <span style={{ fontSize: '14px', color: '#666' }}>
            {language === 'ko' ? '계정이 없으신가요? ' : "Don't have an account? "}
          </span>
          <button
            onClick={() => navigate('/signup')}
            style={{
              background: 'none',
              border: 'none',
              color: '#007AFF',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {language === 'ko' ? '회원가입' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
