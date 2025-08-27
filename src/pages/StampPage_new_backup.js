import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { translations, getLanguage } from '../utils/translations';

function StampPage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('ko');
  const [nearbyTouristSpots, setNearbyTouristSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentGPS, setCurrentGPS] = useState(null);
  
  const t = translations[language];

  useEffect(() => {
    const savedLanguage = getLanguage();
    setLanguage(savedLanguage);
    
    // GPS 위치 가져오기
    getCurrentLocation();
  }, []);

  // 현재 위치 가져오기
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const gps = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setCurrentGPS(gps);
          fetchNearbyTouristSpots(gps.latitude, gps.longitude);
        },
        (error) => {
          console.error('GPS 오류:', error);
          // 기본 위치 (경복궁)
          const defaultGPS = { latitude: 37.5759, longitude: 126.9768 };
          setCurrentGPS(defaultGPS);
          fetchNearbyTouristSpots(defaultGPS.latitude, defaultGPS.longitude);
        }
      );
    } else {
      // 기본 위치 (경복궁)
      const defaultGPS = { latitude: 37.5759, longitude: 126.9768 };
      setCurrentGPS(defaultGPS);
      fetchNearbyTouristSpots(defaultGPS.latitude, defaultGPS.longitude);
    }
  };

  // RDS에서 가까운 관광지 데이터 가져오기
  const fetchNearbyTouristSpots = async (latitude, longitude) => {
    try {
      setLoading(true);
      console.log(`🔍 RDS에서 가까운 관광지 조회: ${latitude}, ${longitude}`);
      
      const response = await fetch(`/api/tourist-spots/nearby?latitude=${latitude}&longitude=${longitude}&radius=10000`);
      const data = await response.json();
      
      if (data.success && data.data) {
        console.log('✅ RDS 관광지 데이터 로드 성공:', data.data.length, '개');
        setNearbyTouristSpots(data.data);
      } else {
        console.log('⚠️ RDS 관광지 데이터 없음');
        setNearbyTouristSpots([]);
      }
    } catch (error) {
      console.error('❌ RDS 관광지 데이터 로드 실패:', error);
      setNearbyTouristSpots([]);
    } finally {
      setLoading(false);
    }
  };

  // 거리 포맷팅
  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  };

  // 가까운 곳 데이터 (RDS 기반)
  const getNearbyPlaces = () => {
    return nearbyTouristSpots.map(spot => ({
      id: spot.content_id,
      content_id: spot.content_id,
      name: spot.title,
      nameEn: spot.title,
      image: spot.image_url || `https://myturn9.s3.amazonaws.com/Cultural%20Heritage/${encodeURIComponent(spot.title)}.jpg`,
      distance: formatDistance(spot.distance || 0),
      category: spot.spot_category || '문화재'
    }));
  };

  // 유네스코 세계문화유산 데이터
  const getUnescoPlaces = () => {
    return [
      { 
        id: 'changdeokgung', 
        name: '창덕궁', 
        nameEn: 'Changdeokgung Palace',
        content_id: '126508',
        image: 'https://myturn9.s3.amazonaws.com/Cultural%20Heritage/창덕궁.jpg',
        distance: '2.1km',
        category: 'UNESCO 세계문화유산'
      },
      { 
        id: 'jongmyo', 
        name: '종묘', 
        nameEn: 'Jongmyo Shrine',
        content_id: '126508',
        image: 'https://myturn9.s3.amazonaws.com/Cultural%20Heritage/종묘.jpg',
        distance: '1.8km',
        category: 'UNESCO 세계문화유산'
      },
      { 
        id: 'bulguksa', 
        name: '불국사', 
        nameEn: 'Bulguksa Temple',
        content_id: '126508',
        image: 'https://myturn9.s3.amazonaws.com/Cultural%20Heritage/불국사.jpg',
        distance: '267km',
        category: 'UNESCO 세계문화유산'
      },
      { 
        id: 'seokguram', 
        name: '석굴암', 
        nameEn: 'Seokguram Grotto',
        content_id: '126508',
        image: 'https://myturn9.s3.amazonaws.com/Cultural%20Heritage/석굴암.jpg',
        distance: '270km',
        category: 'UNESCO 세계문화유산'
      },
      { 
        id: 'haeinsa', 
        name: '해인사 장경판전', 
        nameEn: 'Haeinsa Temple Janggyeong Panjeon',
        content_id: '126508',
        image: 'https://myturn9.s3.amazonaws.com/Cultural%20Heritage/해인사.jpg',
        distance: '185km',
        category: 'UNESCO 세계문화유산'
      }
    ];
  };

  const nearbyPlaces = getNearbyPlaces();
  const unescoPlaces = getUnescoPlaces();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      paddingBottom: '80px'
    }}>
      {/* 헤더 */}
      <div style={{
        backgroundColor: 'white',
        padding: '15px 20px',
        borderBottom: '1px solid #e0e0e0',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => navigate('/main')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '5px'
            }}
          >
            ←
          </button>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              backgroundImage: 'url(/image/rubber-stamp.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat'
            }}></div>
            <h1 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              {language === 'ko' ? '찍고갈래' : 'Go & Take'}
            </h1>
          </div>
          <div style={{ width: '28px' }}></div>
        </div>
      </div>

      {/* 가까운 곳 섹션 */}
      <div style={{
        backgroundColor: 'white',
        margin: '10px',
        borderRadius: '15px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <span style={{ fontSize: '20px', marginRight: '8px' }}>📍</span>
          <h2 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#333'
          }}>
            {language === 'ko' ? '가까운 곳' : 'Nearby Places'}
          </h2>
        </div>

        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: '#666'
          }}>
            {language === 'ko' ? '로딩 중...' : 'Loading...'}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px'
          }}>
            {nearbyPlaces.map(place => (
              <div 
                key={`nearby-${place.id}`}
                style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px',
                  padding: '15px',
                  cursor: 'pointer',
                  border: '1px solid #e9ecef',
                  transition: 'transform 0.2s ease',
                  textAlign: 'center'
                }}
                onClick={() => navigate(`/tourist-spot/${place.content_id}`)}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                <img 
                  src={place.image} 
                  alt={place.name}
                  style={{
                    width: '100%',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '10px'
                  }}
                  onError={(e) => {
                    e.target.src = `https://myturn9.s3.amazonaws.com/Cultural%20Heritage/${encodeURIComponent(place.name)}.jpg`;
                  }}
                />
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#333',
                  marginBottom: '5px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {language === 'ko' ? place.name : place.nameEn}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  marginBottom: '3px'
                }}>
                  {place.category}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#007bff',
                  fontWeight: 'bold'
                }}>
                  📍 {place.distance}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 유네스코 세계문화유산 섹션 */}
      <div style={{
        backgroundColor: 'white',
        margin: '10px',
        borderRadius: '15px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <span style={{ fontSize: '20px', marginRight: '8px' }}>🏛️</span>
          <h2 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#333'
          }}>
            {language === 'ko' ? '유네스코 세계문화유산' : 'UNESCO World Heritage'}
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '15px'
        }}>
          {unescoPlaces.map(place => (
            <div 
              key={`unesco-${place.id}`}
              style={{
                backgroundColor: '#fff8e1',
                borderRadius: '12px',
                padding: '15px',
                cursor: 'pointer',
                border: '2px solid #ffc107',
                transition: 'transform 0.2s ease',
                textAlign: 'center'
              }}
              onClick={() => navigate(`/tourist-spot/${place.content_id}`)}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              <img 
                src={place.image} 
                alt={place.name}
                style={{
                  width: '100%',
                  height: '80px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  marginBottom: '10px'
                }}
                onError={(e) => {
                  e.target.src = `https://myturn9.s3.amazonaws.com/Cultural%20Heritage/${encodeURIComponent(place.name)}.jpg`;
                }}
              />
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '5px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {language === 'ko' ? place.name : place.nameEn}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#f57c00',
                marginBottom: '3px',
                fontWeight: 'bold'
              }}>
                🏛️ UNESCO
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666',
                fontWeight: 'bold'
              }}>
                📍 {place.distance}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StampPage;
