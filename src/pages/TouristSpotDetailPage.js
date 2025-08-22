import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { translations, getLanguage } from '../utils/translations';

function TouristSpotDetailPage() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const [spotDetail, setSpotDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('ko');

  const t = translations[language];

  useEffect(() => {
    const savedLanguage = getLanguage();
    setLanguage(savedLanguage);
    fetchSpotDetail();
  }, [contentId]);

  const fetchSpotDetail = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 관광지 상세정보 조회:', contentId);

      const response = await fetch(`/api/tourist-spots/${contentId}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ 관광지 상세정보 조회 성공:', result.data);
          setSpotDetail(result.data);
        } else {
          throw new Error(result.message);
        }
      } else {
        throw new Error('API 호출 실패');
      }
    } catch (error) {
      console.error('❌ 관광지 상세정보 조회 실패:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // HTML 태그 제거 함수
  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // 거리 계산 함수 (현재 GPS와 관광지 좌표 비교)
  const calculateDistance = () => {
    const savedGPS = localStorage.getItem('mainPageGPS');
    if (!savedGPS || !spotDetail?.mapX || !spotDetail?.mapY) return null;

    try {
      const gps = JSON.parse(savedGPS);
      const R = 6371; // 지구 반지름 (km)
      const dLat = (parseFloat(spotDetail.mapY) - gps.latitude) * Math.PI / 180;
      const dLng = (parseFloat(spotDetail.mapX) - gps.longitude) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(gps.latitude * Math.PI / 180) * Math.cos(parseFloat(spotDetail.mapY) * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      if (distance < 1) {
        return `${Math.round(distance * 1000)}m`;
      } else {
        return `${distance.toFixed(1)}km`;
      }
    } catch (error) {
      console.error('거리 계산 오류:', error);
      return null;
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #007AFF',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 15px'
          }}></div>
          <div style={{ fontSize: '16px', color: '#666' }}>
            관광지 정보를 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'white'
      }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '18px', color: '#ff4444', marginBottom: '10px' }}>
            ❌ 오류 발생
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
            {error}
          </div>
          <button 
            onClick={() => navigate(-1)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!spotDetail) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', color: '#666' }}>
            관광지 정보를 찾을 수 없습니다.
          </div>
        </div>
      </div>
    );
  }

  const distance = calculateDistance();

  return (
    <div style={{ 
      height: '100vh', 
      backgroundColor: 'white', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '15px 20px',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <button 
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '5px'
          }}
        >
          ← 뒤로
        </button>
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
          관광지 정보
        </div>
        <div style={{ width: '40px' }}></div>
      </div>

      {/* Content */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        padding: '0'
      }}>
        {/* 메인 이미지 */}
        {spotDetail.firstImage && (
          <div style={{ 
            width: '100%', 
            height: '250px', 
            position: 'relative',
            backgroundColor: '#f0f0f0'
          }}>
            <img 
              src={spotDetail.firstImage} 
              alt={spotDetail.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div 
              style={{ 
                width: '100%', 
                height: '100%', 
                background: '#f0f0f0',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: '14px'
              }}
            >
              이미지 없음
            </div>
          </div>
        )}

        <div style={{ padding: '20px' }}>
          {/* 제목 및 기본 정보 */}
          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              margin: '0 0 10px 0',
              color: '#333'
            }}>
              {spotDetail.title}
            </h1>
            
            {distance && (
              <div style={{ 
                fontSize: '14px', 
                color: '#007AFF',
                marginBottom: '10px'
              }}>
                📍 현재 위치에서 {distance}
              </div>
            )}
          </div>

          {/* 정보 카드들 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {/* 주소 */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '10px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 'bold', 
                color: '#495057',
                marginBottom: '8px'
              }}>
                📍 주소
              </div>
              <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.4' }}>
                {spotDetail.addr1}
                {spotDetail.addr2 && ` ${spotDetail.addr2}`}
                {spotDetail.zipcode && ` (${spotDetail.zipcode})`}
              </div>
            </div>

            {/* 전화번호 */}
            {spotDetail.tel && spotDetail.tel !== '전화번호 정보 없음' && (
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '10px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: '#495057',
                  marginBottom: '8px'
                }}>
                  📞 전화번호
                </div>
                <div style={{ fontSize: '14px', color: '#333' }}>
                  <a href={`tel:${spotDetail.tel}`} style={{ color: '#007AFF', textDecoration: 'none' }}>
                    {spotDetail.tel}
                  </a>
                </div>
              </div>
            )}

            {/* 이용시간 */}
            {spotDetail.usetime && spotDetail.usetime !== '이용시간 정보 없음' && (
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '10px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: '#495057',
                  marginBottom: '8px'
                }}>
                  🕐 이용시간
                </div>
                <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.4' }}>
                  {stripHtml(spotDetail.usetime)}
                </div>
              </div>
            )}

            {/* 휴무일 */}
            {spotDetail.restdate && spotDetail.restdate !== '휴무일 정보 없음' && (
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '10px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: '#495057',
                  marginBottom: '8px'
                }}>
                  🚫 휴무일
                </div>
                <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.4' }}>
                  {stripHtml(spotDetail.restdate)}
                </div>
              </div>
            )}

            {/* 이용요금 */}
            {spotDetail.usefee && spotDetail.usefee !== '요금 정보 없음' && (
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '10px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: '#495057',
                  marginBottom: '8px'
                }}>
                  💰 이용요금
                </div>
                <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.4' }}>
                  {stripHtml(spotDetail.usefee)}
                </div>
              </div>
            )}

            {/* 주차장 */}
            {spotDetail.parking && spotDetail.parking !== '주차장 정보 없음' && (
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '10px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: '#495057',
                  marginBottom: '8px'
                }}>
                  🚗 주차장
                </div>
                <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.4' }}>
                  {stripHtml(spotDetail.parking)}
                </div>
              </div>
            )}

            {/* 설명 */}
            {spotDetail.overview && spotDetail.overview !== '설명 정보 없음' && (
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '10px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: '#495057',
                  marginBottom: '8px'
                }}>
                  📝 상세설명
                </div>
                <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.6' }}>
                  {stripHtml(spotDetail.overview)}
                </div>
              </div>
            )}

            {/* 추가 편의시설 정보 */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '10px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 'bold', 
                color: '#495057',
                marginBottom: '8px'
              }}>
                🏢 편의시설
              </div>
              <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.4' }}>
                {spotDetail.chkbabycarriage && (
                  <div>• 유모차 대여: {stripHtml(spotDetail.chkbabycarriage)}</div>
                )}
                {spotDetail.chkpet && (
                  <div>• 애완동물 동반: {stripHtml(spotDetail.chkpet)}</div>
                )}
                {spotDetail.chkcreditcard && (
                  <div>• 신용카드 사용: {stripHtml(spotDetail.chkcreditcard)}</div>
                )}
                {spotDetail.restroom && (
                  <div>• 화장실: {stripHtml(spotDetail.restroom)}</div>
                )}
                {!spotDetail.chkbabycarriage && !spotDetail.chkpet && !spotDetail.chkcreditcard && !spotDetail.restroom && (
                  <div style={{ color: '#999' }}>편의시설 정보가 없습니다.</div>
                )}
              </div>
            </div>
          </div>

          {/* 하단 여백 */}
          <div style={{ height: '20px' }}></div>
        </div>
      </div>
    </div>
  );
}

export default TouristSpotDetailPage;
