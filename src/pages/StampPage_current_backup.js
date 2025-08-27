import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { translations, getLanguage } from '../utils/translations';

function StampPage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('ko');
  const [nearbyTouristSpots, setNearbyTouristSpots] = useState([]);
  const [loading, setLoading] = useState(false);
  const t = translations[language];
  
  useEffect(() => {
    const savedLanguage = getLanguage();
    setLanguage(savedLanguage);
    
    // GPS 위치 가져오기 및 RDS 데이터 로드
    getCurrentLocation();
  }, []);

  // 현재 위치 가져오기
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchNearbyTouristSpots(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('GPS 오류:', error);
          // 기본 위치 (경복궁)
          fetchNearbyTouristSpots(37.5759, 126.9768);
        }
      );
    } else {
      // 기본 위치 (경복궁)
      fetchNearbyTouristSpots(37.5759, 126.9768);
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

  // 기존 스탬프 데이터
  const stampData = [
    { 
      id: 1, 
      name: '경회루', 
      collected: true, 
      image: '/heritage/gyeonghoeru.jpg',
      position: { top: '35%', left: '45%' }
    },
    { 
      id: 2, 
      name: '광화문', 
      collected: false, 
      image: '/heritage/gwanghwamun.jpg',
      position: { top: '60%', left: '70%' }
    },
    { 
      id: 3, 
      name: '민속박물관', 
      collected: true, 
      image: '/heritage/folk_museum.jpg',
      position: { top: '75%', left: '25%' }
    }
  ];

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
      }
    ];
  };

  const nearbyPlaces = getNearbyPlaces();
  const unescoPlaces = getUnescoPlaces();
  const collectedCount = stampData.filter(stamp => stamp.collected).length;

  return (
    <div style={{ 
      height: '100vh', 
      backgroundColor: '#f5f5f5', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'auto'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '15px 20px',
        borderBottom: '1px solid #e0e0e0',
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
            cursor: 'pointer'
          }}
        >
          ←
        </button>
        <h1 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          {language === 'ko' ? '찍고갈래' : 'Go & Take'}
        </h1>
        <div style={{ width: '20px' }}></div>
      </div>

      {/* 기존 스탬프 섹션 */}
      <div style={{
        backgroundColor: 'white',
        margin: '10px',
        borderRadius: '15px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          margin: '0 0 15px 0',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          📸 {language === 'ko' ? '스탬프 수집' : 'Stamp Collection'}
        </h2>
        <div style={{
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#4CAF50'
          }}>
            {collectedCount} / {stampData.length}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#666'
          }}>
            {language === 'ko' ? '수집 완료' : 'Collected'}
          </div>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px'
        }}>
          {stampData.map(stamp => (
            <div 
              key={stamp.id}
              style={{
                backgroundColor: stamp.collected ? '#e8f5e8' : '#f0f0f0',
                borderRadius: '10px',
                padding: '15px',
                textAlign: 'center',
                cursor: 'pointer',
                opacity: stamp.collected ? 1 : 0.6
              }}
              onClick={() => stamp.collected && navigate(`/tourist-spot/126508`)}
            >
              <div style={{
                fontSize: '30px',
                marginBottom: '5px'
              }}>
                {stamp.collected ? '✅' : '⭕'}
              </div>
              <div style={{
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {stamp.name}
              </div>
            </div>
          ))}
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
        <h2 style={{
          margin: '0 0 15px 0',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          📍 {language === 'ko' ? '가까운 곳' : 'Nearby Places'}
        </h2>

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
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '10px'
          }}>
            {nearbyPlaces.map(place => (
              <div 
                key={`nearby-${place.id}`}
                style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '10px',
                  padding: '10px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
                onClick={() => navigate(`/tourist-spot/${place.content_id}`)}
              >
                <img 
                  src={place.image} 
                  alt={place.name}
                  style={{
                    width: '100%',
                    height: '60px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}
                  onError={(e) => {
                    e.target.src = `https://myturn9.s3.amazonaws.com/Cultural%20Heritage/${encodeURIComponent(place.name)}.jpg`;
                  }}
                />
                <div style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginBottom: '3px'
                }}>
                  {language === 'ko' ? place.name : place.nameEn}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: '#007bff'
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
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '80px'
      }}>
        <h2 style={{
          margin: '0 0 15px 0',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          🏛️ {language === 'ko' ? '유네스코 세계문화유산' : 'UNESCO World Heritage'}
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '10px'
        }}>
          {unescoPlaces.map(place => (
            <div 
              key={`unesco-${place.id}`}
              style={{
                backgroundColor: '#fff8e1',
                borderRadius: '10px',
                padding: '10px',
                cursor: 'pointer',
                textAlign: 'center',
                border: '2px solid #ffc107'
              }}
              onClick={() => navigate(`/tourist-spot/${place.content_id}`)}
            >
              <img 
                src={place.image} 
                alt={place.name}
                style={{
                  width: '100%',
                  height: '60px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  marginBottom: '8px'
                }}
                onError={(e) => {
                  e.target.src = `https://myturn9.s3.amazonaws.com/Cultural%20Heritage/${encodeURIComponent(place.name)}.jpg`;
                }}
              />
              <div style={{
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '3px'
              }}>
                {language === 'ko' ? place.name : place.nameEn}
              </div>
              <div style={{
                fontSize: '10px',
                color: '#f57c00',
                fontWeight: 'bold'
              }}>
                🏛️ UNESCO
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StampPage;
