import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { translations, getLanguage, setLanguage as saveLanguage } from '../utils/translations';
import { initializeFontSize } from '../utils/fontSizeUtils';

// CSS 애니메이션을 위한 스타일 추가
const spinKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// 스타일 태그를 head에 추가
if (!document.querySelector('#main-animations')) {
  const style = document.createElement('style');
  style.id = 'main-animations';
  style.textContent = spinKeyframes;
  document.head.appendChild(style);
}

// 칼만필터 클래스
class KalmanFilter {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.x = { lat: 0, lng: 0 };
    this.P = { lat: 8000, lng: 8000 };
    this.Q = { lat: 25, lng: 25 };
    this.initialized = false;
    this.count = 0;
  }
    
  update(measurement) {
    this.count++;
      
    if (!this.initialized) {
      this.x.lat = measurement.latitude;
      this.x.lng = measurement.longitude;
      this.initialized = true;
      return {
        latitude: measurement.latitude,
        longitude: measurement.longitude,
        accuracy: measurement.accuracy
      };
    }
    
    const R = {
      lat: Math.max(measurement.accuracy / 3, 30),
      lng: Math.max(measurement.accuracy / 3, 30)
    };
    
    const x_pred = { lat: this.x.lat, lng: this.x.lng };
    const P_pred = { lat: this.P.lat + this.Q.lat, lng: this.P.lng + this.Q.lng };
    
    const K = {
      lat: P_pred.lat / (P_pred.lat + R.lat),
      lng: P_pred.lng / (P_pred.lng + R.lng)
    };
    
    this.x.lat = x_pred.lat + K.lat * (measurement.latitude - x_pred.lat);
    this.x.lng = x_pred.lng + K.lng * (measurement.longitude - x_pred.lng);
    
    this.P.lat = (1 - K.lat) * P_pred.lat;
    this.P.lng = (1 - K.lng) * P_pred.lng;
    
    return {
      latitude: this.x.lat,
      longitude: this.x.lng,
      accuracy: Math.sqrt(this.P.lat + this.P.lng)
    };
  }
}

function MainPage() {
  const navigate = useNavigate();
  const [currentGPS, setCurrentGPS] = useState(null);
  const [isGPSReady, setIsGPSReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const kalmanFilterRef = useRef(null);
  const [gpsInterval, setGpsInterval] = useState(null);
  const [language, setLanguage] = useState('ko');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [nearbyTouristSpots, setNearbyTouristSpots] = useState([]);
  const [touristSpotsLoading, setTouristSpotsLoading] = useState(false);
  
  const t = translations[language];
  
  const getKalmanFilter = () => {
    if (!kalmanFilterRef.current) {
      kalmanFilterRef.current = new KalmanFilter();
    }
    return kalmanFilterRef.current;
  };

  useEffect(() => {
    // 기기 타입 감지
    const userAgent = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent));
    setIsAndroid(/Android/.test(userAgent));
    
    // 언어 설정 로드
    const savedLanguage = getLanguage();
    setLanguage(savedLanguage);
    
    // 폰트 크기 초기화
    initializeFontSize();
    
    // GPS 수집 시작
    startGPSCollection();
  }, []);

  // GPS 수집 시작
  const startGPSCollection = async () => {
    try {
      setIsLoading(true);
      
      // 기본 GPS 설정 (서울시청)
      const defaultGPS = {
        accuracy: 1000,
        timestamp: Date.now(),
        deviceType: 'Default',
        captureTime: new Date().toISOString(),
        measurementCount: 1
      };
      
      setCurrentGPS(defaultGPS);
      setIsGPSReady(true);
    } catch (error) {
      console.error('GPS 수집 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // S3 이미지 URL 생성 함수
  const getS3ImageUrl = (imageName) => {
    return `/image/default-tourist-spot.jpg`;
  };

  // 서울 관광지 데이터 (간소화)
  const allHeritageData = [
  ];

  // 거리 포맷팅
  const formatDistance = (distanceKm) => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    } else if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)}km`;
    } else {
      return `${Math.round(distanceKm)}km`;
    }
  };

  // GPS 기반 가까운 관광지 계산
  const getNearbyHeritage = () => {
    return allHeritageData.map(spot => ({
      ...spot,
      formattedDistance: '1.2km'
    })).slice(0, 3);
  };

  const heritageData = getNearbyHeritage();

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif',
      position: 'relative'
    }}>
      {/* Loading Overlay */}
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '15px',
            textAlign: 'center',
            minWidth: '200px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #007AFF',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 15px'
            }}></div>
            <div style={{ fontSize: 'var(--base-font-size)', fontWeight: 'bold', marginBottom: '5px' }}>
              {t.loading}
            </div>
            <div style={{ fontSize: 'var(--small-font-size)', color: '#666' }}>
              {t.gpsProcessing}
            </div>
          </div>
        </div>
      )}

      {/* Content - 헤더 제거하고 바로 컨텐츠 시작 */}
      <div style={{ 
        flex: 1, 
        padding: '20px 20px 10px 20px', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* Language Selector - 독립적으로 최상단 우측에 배치 */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '15px',
          flexShrink: 0,
          position: 'relative'
        }}>
          <div style={{ 
            position: 'relative',
            zIndex: 100
          }}>
            <div 
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                padding: '8px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                border: '1px solid rgba(0, 122, 255, 0.3)'
              }}
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            >
              <img 
                src={language === 'ko' ? "/image/korea.png" : "/image/usa.png"} 
                alt={language === 'ko' ? "한국어" : "English"} 
                style={{ 
                  width: '20px', 
                  height: '14px', 
                  objectFit: 'cover',
                  borderRadius: '2px'
                }} 
              />
              <span style={{ 
                color: '#333',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                {language === 'ko' ? '한국어' : 'English'}
              </span>
              <span style={{ 
                color: '#666',
                fontSize: '11px',
                transform: showLanguageDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}>
                ▼
              </span>
            </div>
            
            {/* Language Dropdown */}
            {showLanguageDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '14px',
                boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                zIndex: 1000,
                minWidth: '140px',
                overflow: 'hidden'
              }}>
                <div 
                  style={{
                    padding: '12px 14px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: language === 'ko' ? '#f0f8ff' : 'white',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                  onClick={() => {
                    setLanguage('ko');
                    saveLanguage('ko');
                    setShowLanguageDropdown(false);
                  }}
                >
                  <img src="/image/korea.png" alt="한국어" style={{ width: '20px', height: '14px', objectFit: 'cover', borderRadius: '2px' }} />
                  <span>한국어</span>
                </div>
                <div 
                  style={{
                    padding: '12px 14px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: language === 'en' ? '#f0f8ff' : 'white'
                  }}
                  onClick={() => {
                    setLanguage('en');
                    saveLanguage('en');
                    setShowLanguageDropdown(false);
                  }}
                >
                  <img src="/image/usa.png" alt="English" style={{ width: '20px', height: '14px', objectFit: 'cover', borderRadius: '2px' }} />
                  <span>English</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Images - 언어 설정 아래에 배치 */}
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          marginBottom: '20px',
          flexShrink: 0
        }}>
          <img 
            src="/image/banner_building.png" 
            alt="이벤트 1"
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
              objectFit: 'cover',
              borderRadius: '8px'
            }}
          />
          <img 
            src="/image/banner_person.png" 
            alt="사람 사진"
            style={{ 
              flex: 1,
              height: '100px',
              objectFit: 'cover',
              borderRadius: '8px'
            }}
          />
        </div>

        {/* Quick Actions - 패딩만 축소, 아이콘/텍스트 크기는 원래대로 */}
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          marginBottom: '20px',
          flexShrink: 0
        }}>
          <div 
            style={{ 
              flex: 1,
              textAlign: 'center', 
              cursor: 'pointer',
              padding: '8px 6px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '5px' }}>❓</div>
            <div style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{t.help}</div>
          </div>
          <div 
            style={{ 
              flex: 1,
              textAlign: 'center', 
              cursor: 'pointer',
              padding: '8px 6px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
            onClick={() => navigate('/toilet')}
          >
            <div style={{ fontSize: '18px', marginBottom: '5px' }}>🚻</div>
            <div style={{ fontSize: '10px', whiteSpace: 'nowrap', textAlign: 'center', lineHeight: '1.2' }}>{t.publicToilet}</div>
          </div>
          <div 
            style={{ 
              flex: 1,
              textAlign: 'center', 
              cursor: 'pointer',
              padding: '8px 6px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '5px' }}>💊</div>
            <div style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{t.pharmacy}</div>
          </div>
          <div 
            style={{ 
              flex: 1,
              textAlign: 'center', 
              cursor: 'pointer',
              padding: '8px 6px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
            onClick={() => navigate('/community')}
          >
            <div style={{ fontSize: '18px', marginBottom: '5px' }}>💬</div>
            <div style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>{t.community}</div>
          </div>
        </div>

        {/* Tourism News */}
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: 'var(--base-font-size)', fontWeight: 'bold', margin: 0 }}>
              {t.tourismNews}
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '20px' }}>
            {heritageData.map(heritage => (
              <div 
                key={heritage.id}
                style={{
                  background: '#faf3f3',
                  borderRadius: '12px',
                  padding: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  display: 'flex',
                  gap: '12px',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/detail/${heritage.id}`)}
              >
                <div style={{ flexShrink: 0 }}>
                  <img 
                    src={heritage.image} 
                    alt={heritage.name}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ 
                    fontSize: 'var(--base-font-size)', 
                    fontWeight: '600', 
                    marginBottom: '3px',
                    color: '#333'
                  }}>
                    {language === 'ko' ? heritage.name : heritage.nameEn}
                  </div>
                  <div style={{ 
                    fontSize: 'var(--small-font-size)', 
                    color: '#666',
                    marginBottom: '3px'
                  }}>
                    📍 {language === 'ko' ? heritage.address : heritage.addressEn}
                  </div>
                  <div style={{ 
                    fontSize: 'var(--small-font-size)', 
                    color: '#007AFF',
                    fontWeight: '500'
                  }}>
                    {t.currentLocation} {heritage.formattedDistance}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="nav-bar">
        <div 
          className="nav-item"
          onClick={() => navigate('/stamp')}
          style={{ cursor: 'pointer' }}
        >
          <div 
            className="nav-icon" 
            style={{ backgroundImage: 'url(/image/rubber-stamp.png)' }}
          ></div>
          <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{language === 'ko' ? '찍고갈래' : 'go & take'}</span>
        </div>
        <div 
          className="nav-item"
          onClick={() => {
            if (!isGPSReady) {
              alert(t.loadingWait);
              return;
            }
            navigate('/camera');
          }}
          style={{ cursor: 'pointer' }}
        >
          <div 
            className="nav-icon" 
            style={{ backgroundImage: 'url(/image/nav_camera.png)' }}
          ></div>
          <span style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{t.camera}</span>
        </div>
        <div 
          className="nav-item"
          onClick={() => navigate('/settings')}
          style={{ cursor: 'pointer' }}
        >
          <div 
            className="nav-icon" 
            style={{ backgroundImage: 'url(/image/settings.png)' }}
          ></div>
          <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{t.settings}</span>
        </div>
      </div>
    </div>
  );
}

export default MainPage;
