import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { translations, getLanguage } from '../utils/translations';

function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [spotDetail, setSpotDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('ko');

  const t = translations[language];

  useEffect(() => {
    const savedLanguage = getLanguage();
    setLanguage(savedLanguage);
    fetchSpotDetail();
  }, [id]);

  const fetchSpotDetail = async () => {
    try {
      setLoading(true);
      console.log('🔍 관광지 상세정보 조회:', id);

      // 먼저 RDS에서 데이터 조회 시도
      try {
        const response = await fetch(`http://localhost:5007/api/tourist-spots/${id}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setSpotDetail(result.data);
            setLoading(false);
            return;
          }
        }
      } catch (apiError) {
        console.log('관광지 API 호출 실패, 목업 데이터 사용:', apiError);
      }

      // RDS 데이터가 없으면 목업 데이터 사용
      const mockData = getMockSpotData(id);
      setSpotDetail(mockData);
      setLoading(false);

    } catch (error) {
      console.error('관광지 상세정보 조회 오류:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const getMockSpotData = (spotId) => {
    const mockSpots = {
      'gyeongbokgung': {
        id: 1,
        content_id: 'gyeongbokgung',
        title: '경복궁',
        address: '서울특별시 종로구 사직로 161',
        tel: '02-3700-3900',
        homepage: 'http://www.royalpalace.go.kr',
        image_url: 'https://myturn9.s3.ap-northeast-1.amazonaws.com/tour-spots/images/경복궁_1.jpg',
        overview: '경복궁은 1392년 조선 건국 후 1395년(태조 4)에 창건한 조선왕조 제일의 법궁이다. 경복궁은 백악산(북악산)을 주산으로 넓은 지형에 건물을 배치하였고 정문인 광화문 앞으로 넓은 육조거리가 펼쳐진 한양의 중심이었다.',
        use_time: '[3월~5월] 09:00~18:00 (입장마감 17:00)\n[6월~8월] 09:00~18:30 (입장마감 17:30)\n[9월~10월] 09:00~18:00 (입장마감 17:00)\n[11월~2월] 09:00~17:00 (입장마감 16:00)',
        parking: '가능 (승용차 240대 / 버스 50대)',
        rest_date: '화요일',
        facilities: { fee: '성인 3,000원, 청소년 1,500원, 어린이 1,500원' }
      },
      'changdeokgung': {
        id: 2,
        content_id: 'changdeokgung',
        title: '창덕궁',
        address: '서울특별시 종로구 율곡로 99',
        tel: '02-3668-2300',
        homepage: 'http://www.cdg.go.kr',
        image_url: '/image/default-tourist-spot.jpg',
        overview: '창덕궁은 조선시대 궁궐 중 가장 오랫동안 임금들이 거처한 궁궐로, 자연과 조화를 이룬 아름다운 궁궐입니다.',
        use_time: '09:00~17:30 (입장마감 16:30)',
        parking: '가능',
        rest_date: '월요일',
        facilities: { fee: '성인 3,000원' }
      }
    };

    return mockSpots[spotId] || mockSpots['gyeongbokgung'];
  };

  const isUnescoHeritage = (title) => {
    return title && title.includes('유네스코');
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '정보 없음';
    return timeStr.replace(/\n/g, '\n').replace(/<br>/g, '\n');
  };

  const formatFee = (facilities) => {
    if (!facilities) return '정보 없음';
    if (typeof facilities === 'object' && facilities.fee) {
      return facilities.fee;
    }
    return '정보 없음';
  };

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>🔄</div>
          <div>{t.loading || '로딩 중...'}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: 'white'
      }}>
        <div style={{ textAlign: 'center', color: '#ff4444' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>❌</div>
          <div>오류가 발생했습니다</div>
          <div style={{ fontSize: '14px', marginTop: '5px' }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100vh', 
      backgroundColor: 'white', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '15px 20px',
        borderBottom: '1px solid #eee',
        backgroundColor: 'white'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            marginRight: '15px'
          }}
        >
          ←
        </button>
        <h1 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          margin: 0,
          flex: 1
        }}>
          {spotDetail?.title || '관광지 상세정보'}
        </h1>
        {isUnescoHeritage(spotDetail?.title) && (
          <div style={{
            backgroundColor: '#007AFF',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 'bold'
          }}>
            UNESCO
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
        {/* Main Image */}
        <div style={{ marginBottom: '20px', marginTop: '20px' }}>
          <img
            src={spotDetail?.image_url || '/image/default-tourist-spot.jpg'}
            alt={spotDetail?.title}
            style={{
              width: '100%',
              height: '200px',
              objectFit: 'cover',
              borderRadius: '12px',
              backgroundColor: '#f5f5f5'
            }}
            onError={(e) => {
              e.target.src = '/image/default-tourist-spot.jpg';
            }}
          />
        </div>

        {/* Basic Info */}
        <div style={{ marginBottom: '25px' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            color: '#333'
          }}>
            {spotDetail?.title}
          </h2>
          <div style={{ 
            fontSize: '14px', 
            color: '#666', 
            marginBottom: '5px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <span style={{ marginRight: '8px' }}>📍</span>
            {spotDetail?.address || '주소 정보 없음'}
          </div>
          {spotDetail?.tel && (
            <div style={{ 
              fontSize: '14px', 
              color: '#666',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: '8px' }}>📞</span>
              {spotDetail.tel}
            </div>
          )}
        </div>

        {/* Overview */}
        {spotDetail?.overview && (
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              marginBottom: '10px',
              color: '#333',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: '8px' }}>📖</span>
              개요
            </h3>
            <div style={{ 
              fontSize: '14px', 
              lineHeight: '1.6', 
              color: '#555',
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '8px',
              whiteSpace: 'pre-line'
            }}>
              {spotDetail.overview}
            </div>
          </div>
        )}

        {/* Operating Hours */}
        {spotDetail?.use_time && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              marginBottom: '10px',
              color: '#333',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: '8px' }}>🕐</span>
              이용시간
            </h3>
            <div style={{ 
              fontSize: '14px', 
              color: '#555',
              backgroundColor: '#f0f8ff',
              padding: '12px',
              borderRadius: '8px',
              whiteSpace: 'pre-line'
            }}>
              {formatTime(spotDetail.use_time)}
            </div>
          </div>
        )}

        {/* Parking Info */}
        {spotDetail?.parking && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              marginBottom: '10px',
              color: '#333',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: '8px' }}>🚗</span>
              주차정보
            </h3>
            <div style={{ 
              fontSize: '14px', 
              color: '#555',
              backgroundColor: '#f0fff0',
              padding: '12px',
              borderRadius: '8px'
            }}>
              {spotDetail.parking}
            </div>
          </div>
        )}

        {/* Admission Fee */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            color: '#333',
            display: 'flex',
            alignItems: 'center'
          }}>
            <span style={{ marginRight: '8px' }}>💰</span>
            입장료
          </h3>
          <div style={{ 
            fontSize: '14px', 
            color: '#555',
            backgroundColor: '#fff8f0',
            padding: '12px',
            borderRadius: '8px'
          }}>
            {formatFee(spotDetail?.facilities)}
          </div>
        </div>

        {/* Rest Days */}
        {spotDetail?.rest_date && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              marginBottom: '10px',
              color: '#333',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: '8px' }}>🚫</span>
              휴무일
            </h3>
            <div style={{ 
              fontSize: '14px', 
              color: '#555',
              backgroundColor: '#fff0f0',
              padding: '12px',
              borderRadius: '8px'
            }}>
              {spotDetail.rest_date}
            </div>
          </div>
        )}

        {/* Homepage */}
        {spotDetail?.homepage && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              marginBottom: '10px',
              color: '#333',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: '8px' }}>🌐</span>
              홈페이지
            </h3>
            <a 
              href={spotDetail.homepage}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                fontSize: '14px', 
                color: '#007AFF',
                textDecoration: 'none',
                backgroundColor: '#f0f8ff',
                padding: '12px',
                borderRadius: '8px',
                display: 'block'
              }}
            >
              {spotDetail.homepage}
            </a>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div style={{
        display: 'flex',
        borderTop: '1px solid #eee',
        backgroundColor: 'white',
        padding: '10px 20px'
      }}>
        <div 
          className="nav-item"
          onClick={() => navigate('/main')}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '5px'
          }}
        >
          <div 
            className="nav-icon" 
            style={{ backgroundImage: 'url(/image/home.png)' }}
          ></div>
          <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>홈</span>
        </div>
        <div 
          className="nav-item"
          onClick={() => navigate('/stamp')}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '5px'
          }}
        >
          <div 
            className="nav-icon" 
            style={{ backgroundImage: 'url(/image/rubber-stamp.png)' }}
          ></div>
          <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>찍고갈래</span>
        </div>
        <div 
          className="nav-item"
          onClick={() => navigate('/camera')}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '5px'
          }}
        >
          <div 
            className="nav-icon" 
            style={{ backgroundImage: 'url(/image/nav_camera.png)' }}
          ></div>
          <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>사진찍기</span>
        </div>
        <div 
          className="nav-item"
          onClick={() => navigate('/settings')}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '5px'
          }}
        >
          <div 
            className="nav-icon" 
            style={{ backgroundImage: 'url(/image/settings.png)' }}
          ></div>
          <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>설정</span>
        </div>
      </div>
    </div>
  );
}

export default DetailPage;
