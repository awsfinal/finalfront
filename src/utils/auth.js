// 인증 관련 유틸리티 함수들

/**
 * 로컬스토리지에서 JWT 토큰 가져오기
 * @returns {string|null} JWT 토큰
 */
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * 로컬스토리지에서 사용자 정보 가져오기
 * @returns {object|null} 사용자 정보
 */
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('사용자 정보 파싱 오류:', error);
      return null;
    }
  }
  return null;
};

/**
 * 사용자가 로그인되어 있는지 확인
 * @returns {boolean} 로그인 상태
 */
export const isAuthenticated = () => {
  const token = getAuthToken();
  const user = getUser();
  
  if (!token || !user) {
    return false;
  }

  try {
    // JWT 토큰의 만료 시간 확인
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < currentTime) {
      // 토큰이 만료된 경우 로컬스토리지에서 제거
      logout();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    logout();
    return false;
  }
};

/**
 * 로그아웃 처리
 */
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

/**
 * API 요청 시 사용할 인증 헤더 생성
 * @returns {object} Authorization 헤더
 */
export const getAuthHeaders = () => {
  const token = getAuthToken();
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  return {
    'Content-Type': 'application/json'
  };
};

/**
 * 백엔드 API로 토큰 검증 요청
 * @returns {Promise<boolean>} 토큰 유효성
 */
export const verifyTokenWithServer = async () => {
  try {
    const token = getAuthToken();
    if (!token) return false;

    const response = await fetch('/api/auth/verify', {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await response.json();
    
    if (data.success) {
      // 서버에서 받은 최신 사용자 정보로 업데이트
      localStorage.setItem('user', JSON.stringify(data.user));
      return true;
    } else {
      logout();
      return false;
    }
  } catch (error) {
    console.error('서버 토큰 검증 오류:', error);
    return false;
  }
};

/**
 * 보호된 라우트를 위한 인증 체크
 * @param {function} navigate - React Router navigate 함수
 * @returns {boolean} 인증 상태
 */
export const requireAuth = (navigate) => {
  if (!isAuthenticated()) {
    navigate('/login');
    return false;
  }
  return true;
};

/**
 * 사용자 프로필 이미지 URL 가져오기
 * @returns {string} 프로필 이미지 URL
 */
export const getUserProfileImage = () => {
  const user = getUser();
  // 구글 프로필 이미지가 있으면 사용, 없으면 기본 이미지 대신 이모지 사용
  return user?.picture || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiNmMGYwZjAiLz4KPHN2ZyB4PSI2IiB5PSI2IiB3aWR0aD0iMTIiIGhlaWdodD0iMTIiPgo8dGV4dCB4PSI2IiB5PSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2Ij7wn5GKPC90ZXh0Pgo8L3N2Zz4KPC9zdmc+';
};

/**
 * 사용자 표시 이름 가져오기
 * @returns {string} 사용자 이름
 */
export const getUserDisplayName = () => {
  const user = getUser();
  return user?.name || user?.email || '사용자';
};
