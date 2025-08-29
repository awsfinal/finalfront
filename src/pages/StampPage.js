import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { translations, getLanguage, setLanguage as saveLanguage } from '../utils/translations';
import { initializeFontSize } from '../utils/fontSizeUtils';

function StampPage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('ko');
  const [selectedCategory, setSelectedCategory] = useState('culturalHeritage');
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const [rdsData, setRdsData] = useState([]); // RDS 데이터
  const [experienceData, setExperienceData] = useState([]); // 체험관 데이터
  const [unescoData, setUnescoData] = useState([]); // 유네스코 데이터
  const [isLoadingRDS, setIsLoadingRDS] = useState(false); // RDS 로딩 상태
  const [currentGPS, setCurrentGPS] = useState(null); // GPS 위치
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false); // 상세 정보 모달 표시 상태
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState(null); // 선택된 장소의 상세 정보
  const [mapLevel, setMapLevel] = useState(10); // 최대 축소 레벨
  const [markers, setMarkers] = useState([]);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  // RDS에서 체험관 데이터 가져오기
  const fetchExperienceData = async () => {
    if (!currentGPS) {
      console.log('❌ GPS 데이터 없음, 체험관 조회 건너뜀');
      return;
    }

    console.log('🎯 체험관 데이터 요청 시작:', currentGPS);
    
    try {
      const url = `/api/stamp/experience-centers?latitude=${currentGPS.latitude}&longitude=${currentGPS.longitude}&limit=30`;
      console.log('📡 체험관 API 호출:', url);
      
      const response = await fetch(url);
      console.log('📡 체험관 API 응답 상태:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📡 체험관 API 응답 데이터:', result);
        
        if (result.success && result.data) {
          console.log('✅ 체험관 RDS 데이터 수신:', result.data.length, '개');
          setExperienceData(result.data);
        } else {
          console.warn('⚠️ 체험관 RDS 응답 형식 오류:', result);
          setExperienceData([]);
        }
      } else {
        console.error('❌ 체험관 RDS API 호출 실패:', response.status);
        setExperienceData([]);
      }
    } catch (error) {
      console.error('❌ 체험관 RDS 데이터 가져오기 오류:', error);
      setExperienceData([]);
    }
  };

  // RDS에서 유네스코 데이터 가져오기
  const fetchUnescoData = async () => {
    if (!currentGPS) {
      console.log('❌ GPS 데이터 없음, 유네스코 조회 건너뜀');
      return;
    }

    console.log('🎯 유네스코 데이터 요청 시작:', currentGPS);
    
    try {
      const url = `/api/stamp/unesco-spots?latitude=${currentGPS.latitude}&longitude=${currentGPS.longitude}&limit=50`;
      console.log('📡 유네스코 API 호출:', url);
      
      const response = await fetch(url);
      console.log('📡 유네스코 API 응답 상태:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📡 유네스코 API 응답 데이터:', result);
        
        if (result.success && result.data) {
          console.log('✅ 유네스코 RDS 데이터 수신:', result.data.length, '개');
          setUnescoData(result.data);
        } else {
          console.warn('⚠️ 유네스코 RDS 응답 형식 오류:', result);
          setUnescoData([]);
        }
      } else {
        console.error('❌ 유네스코 RDS API 호출 실패:', response.status);
        setUnescoData([]);
      }
    } catch (error) {
      console.error('❌ 유네스코 RDS 데이터 가져오기 오류:', error);
      setUnescoData([]);
    }
  };

  // RDS에서 관광지 데이터 가져오기 (찍고갈래 전용)
  const fetchRDSData = async () => {
    console.log('🎯 fetchRDSData 호출됨');
    console.log('🔍 currentGPS 상태:', currentGPS);
    
    if (!currentGPS) {
      console.log('❌ GPS 데이터 없음, RDS 조회 건너뜀');
      return;
    }

    console.log('🎯 RDS 데이터 요청 시작:', currentGPS, 'category:', selectedCategory);
    setIsLoadingRDS(true);
    
    try {
      // 기존 nearby API 사용하고 프론트엔드에서 카테고리 필터링
      const url = `/api/tourist-spots/nearby?latitude=${currentGPS.latitude}&longitude=${currentGPS.longitude}&limit=50`;
      console.log('📡 nearby API 호출:', url);
      console.log('📍 현재 카테고리:', selectedCategory);
      
      const response = await fetch(url);
      console.log('📡 API 응답 상태:', response.status);
      console.log('📡 API 응답 헤더:', response.headers);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📡 nearby API 응답:', result);
        
        // 카테고리 매핑
        const categoryMap = {
          'culturalHeritage': '문화재',
          'touristSpot': '관광지', 
          'experienceCenter': '문화시설'
        };
        
        const targetCategory = categoryMap[selectedCategory];
        console.log('🎯 필터링 대상 카테고리:', targetCategory);
        
        // 프론트엔드에서 카테고리별 필터링
        let filteredData = result.data || [];
        if (targetCategory) {
          filteredData = filteredData.filter(item => 
            item.spot_category === targetCategory
          );
        }
        
        console.log(`✅ ${selectedCategory} 카테고리 데이터:`, filteredData.length, '개');
        console.log('📊 필터링된 데이터:', filteredData.slice(0, 3));
        
        // 각 아이템의 ID 정보를 자세히 로깅
        filteredData.forEach((item, index) => {
          console.log(`🔍 필터링된 아이템 ${index + 1}:`, {
            title: item.title,
            id: item.id,
            content_id: item.content_id,
            spot_category: item.spot_category,
            area_code: item.area_code,
            area_name: item.area_name
          });
        });
        
        setRdsData(filteredData);
      } else {
        console.error('❌ nearby API 호출 실패:', response.status);
        setRdsData([]);
      }
    } catch (error) {
      console.error('❌ 찍고갈래 RDS 데이터 가져오기 오류:', error);
      setRdsData([]);
    } finally {
      setIsLoadingRDS(false);
    }
  };

  // GPS 위치 가져오기
  const getCurrentLocation = () => {
    console.log('🔍 GPS 초기화 시작...');
    
    // 먼저 저장된 GPS 데이터 확인
    const savedGPS = localStorage.getItem('mainPageGPS') || localStorage.getItem('cameraPageGPS');
    if (savedGPS) {
      try {
        const gpsData = JSON.parse(savedGPS);
        if (gpsData.latitude && gpsData.longitude) {
          setCurrentGPS(gpsData);
          console.log('✅ 저장된 GPS 데이터 사용:', gpsData);
          return;
        }
      } catch (error) {
        console.warn('⚠️ 저장된 GPS 데이터 파싱 실패:', error);
      }
    }

    console.log('📍 저장된 GPS 없음, 기본 위치 사용');
    // 기본 위치 (경복궁) 즉시 설정
    const defaultGPS = {
      latitude: 37.5788,
      longitude: 126.9770,
      accuracy: 100,
      timestamp: new Date().toISOString(),
      isDefault: true
    };
    setCurrentGPS(defaultGPS);
    console.log('✅ 기본 GPS 설정 완료:', defaultGPS);

    // 실시간 GPS 획득 시도
    if (navigator.geolocation) {
      console.log('🔄 실시간 GPS 획득 시도...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const gpsData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          setCurrentGPS(gpsData);
          console.log('✅ 실시간 GPS 획득 성공:', gpsData);
        },
        (error) => {
          console.warn('⚠️ 실시간 GPS 획득 실패, 기본 위치 유지:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5분
        }
      );
    }
  };

  // 컴포넌트 마운트 시 GPS 및 RDS 데이터 가져오기
  useEffect(() => {
    console.log('🚀 StampPage 컴포넌트 마운트됨');
    getCurrentLocation();
    
    // 강제로 기본 GPS로 RDS 데이터 로드 시도
    setTimeout(() => {
      if (!currentGPS) {
        console.log('⚡ 강제 RDS 데이터 로드 시도');
        const forceGPS = {
          latitude: 37.5788,
          longitude: 126.9770,
          accuracy: 100,
          timestamp: new Date().toISOString(),
          isDefault: true
        };
        setCurrentGPS(forceGPS);
      }
    }, 2000);
  }, []);

  // GPS 위치가 설정되면 RDS 데이터 가져오기
  useEffect(() => {
    console.log('🔄 currentGPS 변경됨:', currentGPS);
    if (currentGPS) {
      fetchRDSData();
      fetchExperienceData();
      fetchUnescoData();
    }
  }, [currentGPS]);

  // 카테고리가 변경되면 RDS 데이터 다시 가져오기
  useEffect(() => {
    console.log('🔄 selectedCategory 변경됨:', selectedCategory);
    if (currentGPS) {
      fetchRDSData(); // 카테고리별 데이터 다시 로드
    }
  }, [selectedCategory]);

  // 리스트에서 장소 클릭 시 상세 정보 표시
  const handleListItemClick = (place) => {
    console.log('리스트 아이템 클릭:', place.name || place.title);
    setSelectedPlaceDetail(place);
    setShowDetailModal(true);
  };

  // 상세 정보 모달 닫기
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedPlaceDetail(null);
  };

  // 상세 정보에서 상세 페이지로 이동
  const goToDetailPage = (place) => {
    closeDetailModal();
    handlePlaceClick(place);
  };

  // 장소 클릭 시 올바른 페이지로 이동하는 함수
  // 패딩된 ID를 실제 content_id로 매핑하는 테이블 (임시 해결책)
  const paddedIdToContentId = {
    '000001': '126508',  // 경복궁
    '000002': '1604941', // 창덕궁 낙선재
    '000003': '126509',  // 덕수궁
    '000004': '126511',  // 창경궁
    '000005': '126510',  // 종묘 [유네스코 세계유산]
    '000006': '126484',  // 경희궁
    '000007': '127454',  // 서울 운현궁
    '000009': '128162',  // 숭례문
    '000010': '128144',  // 조계사(서울)
    '000011': '126535',  // 남산서울타워
    '000012': '2733968', // 강서한강공원
    '000013': '129507',  // 청계천
    '000014': '126537',  // 북촌한옥마을
    '000015': '126485',  // 남산공원(서울)
    '000016': '2476731', // 롯데월드 아쿠아리움
    '000017': '2470006', // 동대문디자인플라자(DDP)
    '000018': '129703',  // 국립중앙박물관
    '000019': '126148',  // 범어사(부산)
    '000020': '126848',  // 해동용궁사
    '000021': '126121',  // 용두산공원
    // 더 많은 데이터가 필요하면 추가
  };

  const handlePlaceClick = (place) => {
    console.log('🎯 장소 클릭:', place.name || place.title);
    console.log('🔍 클릭된 장소 전체 데이터:', place);
    console.log('🆔 ID 정보:', {
      id: place.id,
      content_id: place.content_id,
      originalId: place.originalId
    });
    
    // RDS 데이터인지 확인
    const isRDSData = (
      place.content_id || 
      (place.first_image && place.first_image.includes('myturn9.s3.ap-northeast-1.amazonaws.com')) ||
      place.area_name || 
      place.spot_category ||
      place.addr1 ||
      place.distance !== undefined ||
      place.unesco !== undefined ||
      place.area_code !== undefined
    );
    
    console.log('🔍 데이터 타입 판별:', isRDSData ? 'RDS 데이터' : '기존 데이터');
    
    if (isRDSData) {
      // content_id가 있으면 우선 사용
      let targetId = place.content_id;
      
      if (!targetId) {
        // content_id가 없으면 원본 데이터에서 찾기
        if (place.rawData && place.rawData.content_id) {
          targetId = place.rawData.content_id;
          console.log('🔍 rawData에서 content_id 발견:', targetId);
        } else if (place.id && String(place.id).length >= 6) {
          // 6자리 이상 ID면 사용
          targetId = place.id;
          console.log('🔍 6자리 이상 ID 사용:', targetId);
        } else {
          console.warn(`⚠️ 사용할 수 있는 ID가 없음:`, place);
          
          const title = place.title || place.name;
          alert(`"${title}" 상세 정보를 불러올 수 없습니다.\n\n데이터베이스 연결 문제로 인해 일시적으로 이용할 수 없습니다.\n관리자에게 문의해주세요.`);
          return;
        }
      }
      
      console.log('✅ 사용할 ID:', targetId);
      
      if (!targetId) {
        console.warn('⚠️ RDS 데이터에 사용할 수 있는 ID가 없음');
        return;
      }
      
      console.log('🎯 RDS 데이터 최종 사용할 ID:', targetId);
      console.log('🚀 관광지 상세 페이지로 이동:', `/tourist-spot/${targetId}`);
      navigate(`/tourist-spot/${targetId}`);
    } else {
      // 기존 데이터는 기존 로직 사용
      let targetId = place.content_id || place.id;
      
      // 패딩된 ID를 실제 content_id로 변환
      if (typeof targetId === 'string' && paddedIdToContentId[targetId]) {
        const realContentId = paddedIdToContentId[targetId];
        console.log('🔄 패딩된 ID를 실제 content_id로 변환:', targetId, '→', realContentId);
        targetId = realContentId;
      }
      // 일반적인 패딩 제거 (매핑 테이블에 없는 경우)
      else if (typeof targetId === 'string' && /^0{3,}\d+$/.test(targetId)) {
        const unpaddedId = targetId.replace(/^0+/, '') || '1';
        console.log('🔄 일반 패딩 제거:', targetId, '→', unpaddedId);
        targetId = unpaddedId;
      }
      
      console.log('🎯 기존 데이터 최종 사용할 ID:', targetId);
      console.log('🚀 건물 상세 페이지로 이동:', `/detail/${targetId}`);
      navigate(`/detail/${targetId}`);
    }
  };

  const t = translations[language];
  
  useEffect(() => {
    const savedLanguage = getLanguage();
    setLanguage(savedLanguage);
    initializeFontSize();
    
    // 글씨 크기 변경 이벤트 리스너
    const handleFontSizeChange = () => {
      initializeFontSize();
    };
    window.addEventListener('fontSizeChanged', handleFontSizeChange);
    
    return () => {
      window.removeEventListener('fontSizeChanged', handleFontSizeChange);
    };
  }, []);

  // 언어 변경 함수
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    saveLanguage(newLanguage);
    setShowLanguageDropdown(false);
  };

  // 사용자 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('위치 정보를 가져올 수 없습니다:', error);
          // 기본 위치 (서울시청)
          setUserLocation({
            lat: 37.5665,
            lng: 126.9780
          });
        }
      );
    } else {
      // 기본 위치 설정
      setUserLocation({
        lat: 37.5665,
        lng: 126.9780
      });
    }
  }, []);

  // 카테고리별 데이터 - 지역별 대표와 상세 데이터로 구분
  const categoryData = {
    culturalHeritage: {
      // 지역 대표 문화재 (줌 레벨 8 이상에서 표시)
      regional: [
        { 
          id: 1, 
          name: '경복궁', 
          lat: 37.5796, 
          lng: 126.9770,
          description: '조선 왕조의 정궁',
          popular: true,
          image: '/heritage/gyeongbokgung.jpg',
          rating: 4.8,
          reviews: 15420,
          openTime: '09:00 - 18:00',
          price: '3,000원',
          category: '궁궐',
          address: '서울특별시 종로구 사직로 161',
          region: '서울'
        },
        { 
          id: 2, 
          name: '불국사', 
          lat: 35.7898, 
          lng: 129.3320,
          description: '신라 불교 문화의 정수',
          popular: true,
          image: '/heritage/bulguksa.jpg',
          rating: 4.9,
          reviews: 23450,
          openTime: '07:00 - 18:00',
          price: '6,000원',
          category: '사찰',
          address: '경상북도 경주시 불국로 385',
          region: '경주'
        },
        {
          id: 3,
          name: '해동용궁사',
          lat: 35.1884,
          lng: 129.2233,
          description: '바다 위의 사찰',
          popular: true,
          image: '/heritage/haedong.jpg',
          rating: 4.7,
          reviews: 18920,
          openTime: '05:00 - 19:00',
          price: '무료',
          category: '사찰',
          address: '부산광역시 기장군 기장읍 용궁길 86',
          region: '부산'
        },
        {
          id: 4,
          name: '전주한옥마을',
          lat: 35.8150,
          lng: 127.1530,
          description: '전통 한옥의 아름다움',
          popular: true,
          image: '/heritage/jeonju.jpg',
          rating: 4.5,
          reviews: 32100,
          openTime: '24시간',
          price: '무료',
          category: '한옥마을',
          address: '전라북도 전주시 완산구 기린대로 99',
          region: '전주'
        },
        {
          id: 5,
          name: '수원 화성행궁',
          lat: 37.281868,
          lng: 127.013561,
          description: '조선 후기 행궁의 대표작',
          popular: true,
          image: '/heritage/hwaseong.jpg',
          rating: 4.6,
          reviews: 8920,
          openTime: '09:00 - 18:00',
          price: '1,500원',
          category: '궁궐',
          address: '경기도 수원시 팔달구 정조로 825',
          region: '경기'
        },
        {
          id: 6,
          name: '오죽헌',
          lat: 37.779184,
          lng: 128.877613,
          description: '율곡 이이의 생가',
          popular: false,
          image: '/heritage/ojukheon.jpg',
          rating: 4.4,
          reviews: 3450,
          openTime: '09:00 - 18:00',
          price: '3,000원',
          category: '고택',
          address: '강원특별자치도 강릉시 율곡로 3139번길 24',
          region: '강릉'
        }
      ],
      // 상세 문화재 (줌 레벨 8 이하에서 추가 표시)
      detailed: [
        { 
          id: 7, 
          name: '창덕궁', 
          lat: 37.5794, 
          lng: 126.9910,
          description: '유네스코 세계문화유산',
          popular: true,
          image: '/heritage/changdeokgung.jpg',
          rating: 4.7,
          reviews: 12350,
          openTime: '09:00 - 17:30',
          price: '3,000원',
          category: '궁궐',
          address: '서울특별시 종로구 율곡로 99',
          region: '서울'
        },
        { 
          id: 8, 
          name: '덕수궁', 
          lat: 37.5658, 
          lng: 126.9751,
          description: '대한제국의 황궁',
          popular: false,
          image: '/heritage/deoksugung.jpg',
          rating: 4.5,
          reviews: 8920,
          openTime: '09:00 - 21:00',
          price: '1,000원',
          category: '궁궐',
          address: '서울특별시 중구 세종대로 99',
          region: '서울'
        },
        { 
          id: 9, 
          name: '종묘', 
          lat: 37.5741, 
          lng: 126.9935,
          description: '조선 왕실의 사당',
          popular: true,
          image: '/heritage/jongmyo.jpg',
          rating: 4.6,
          reviews: 6780,
          openTime: '09:00 - 18:00',
          price: '1,000원',
          category: '사당',
          address: '서울특별시 종로구 훈정동 1',
          region: '서울'
        },
        {
          id: 10,
          name: '숭례문',
          lat: 37.55954,
          lng: 126.975281,
          description: '서울의 남대문',
          popular: true,
          image: '/heritage/sungnyemun.jpg',
          rating: 4.3,
          reviews: 12450,
          openTime: '24시간',
          price: '무료',
          category: '성문',
          address: '서울특별시 중구 세종대로 40',
          region: '서울'
        },
        {
          id: 11,
          name: '남한산성행궁',
          lat: 37.478784,
          lng: 127.282080,
          description: '조선시대 임시 행궁',
          popular: false,
          image: '/heritage/namhansanseong.jpg',
          rating: 4.5,
          reviews: 5670,
          openTime: '09:00 - 18:00',
          price: '2,000원',
          category: '행궁',
          address: '경기도 광주시 남한산성면 남한산성로 784-16',
          region: '경기'
        },
        {
          id: 12,
          name: '석굴암',
          lat: 35.795173,
          lng: 129.350288,
          description: '신라 불교 조각의 걸작',
          popular: true,
          image: '/heritage/seokguram.jpg',
          rating: 4.8,
          reviews: 18920,
          openTime: '07:00 - 18:00',
          price: '5,000원',
          category: '석굴',
          address: '경상북도 경주시 불국로 873-243',
          region: '경주'
        },
        {
          id: 13,
          name: '안동 하회마을',
          lat: 35.794879,
          lng: 128.518146,
          description: '조선시대 전통 마을',
          popular: true,
          image: '/heritage/hahoe.jpg',
          rating: 4.7,
          reviews: 15430,
          openTime: '09:00 - 18:00',
          price: '3,000원',
          category: '민속마을',
          address: '경상북도 안동시 풍천면 하회종가길 69',
          region: '안동'
        },
        {
          id: 14,
          name: '해인사',
          lat: 35.801139,
          lng: 128.097961,
          description: '팔만대장경의 보고',
          popular: true,
          image: '/heritage/haeinsa.jpg',
          rating: 4.9,
          reviews: 21340,
          openTime: '08:00 - 18:00',
          price: '3,000원',
          category: '사찰',
          address: '경상남도 합천군 가야면 해인사길 122',
          region: '합천'
        },
        {
          id: 15,
          name: '낙산사',
          lat: 38.124678,
          lng: 128.627417,
          description: '동해의 관음성지',
          popular: false,
          image: '/heritage/naksansa.jpg',
          rating: 4.6,
          reviews: 8920,
          openTime: '04:00 - 20:00',
          price: '4,000원',
          category: '사찰',
          address: '강원특별자치도 양양군 강현면 낙산사로 100',
          region: '양양'
        },
        {
          id: 16,
          name: '월정사',
          lat: 37.731891,
          lng: 128.592879,
          description: '오대산의 대표 사찰',
          popular: true,
          image: '/heritage/woljeongsa.jpg',
          rating: 4.7,
          reviews: 12450,
          openTime: '05:00 - 19:00',
          price: '4,000원',
          category: '사찰',
          address: '강원특별자치도 평창군 진부면 오대산로 374-8',
          region: '평창'
        },
        {
          id: 17,
          name: '간송옛집',
          lat: 37.664850,
          lng: 127.028171,
          description: '간송 전형필의 옛집',
          popular: false,
          image: '/heritage/gangsong.jpg',
          rating: 4.3,
          reviews: 2340,
          openTime: '09:00 - 18:00',
          price: '무료',
          category: '고택',
          address: '서울특별시 성북구 성북로 102-11',
          region: '서울'
        },

        {
          id: 19,
          name: '서대문형무소',
          lat: 37.574257,
          lng: 126.956134,
          description: '일제강점기 감옥 유적',
          popular: true,
          image: '/heritage/seodaemun_prison.jpg',
          rating: 4.6,
          reviews: 11230,
          openTime: '09:30 - 18:00',
          price: '3,000원',
          category: '역사관',
          address: '서울특별시 서대문구 통일로 251',
          region: '서울'
        },
        {
          id: 20,
          name: '창녕위궁재사',
          lat: 37.620681,
          lng: 127.043026,
          description: '조선시대 왕족 재사',
          popular: false,
          image: '/heritage/changnyeong_palace.jpg',
          rating: 4.2,
          reviews: 1890,
          openTime: '09:00 - 18:00',
          price: '무료',
          category: '재사',
          address: '서울특별시 종로구 인사동길 30-1',
          region: '서울'
        },
        {
          id: 21,
          name: '서오릉',
          lat: 37.623580,
          lng: 126.900817,
          description: '조선 왕실의 릉원',
          popular: false,
          image: '/heritage/seooreung.jpg',
          rating: 4.3,
          reviews: 2340,
          openTime: '09:00 - 18:00',
          price: '1,000원',
          category: '릉원',
          address: '경기도 고양시 덕양구 서오릉로 334-92',
          region: '경기'
        },
        {
          id: 22,
          name: '행주산성',
          lat: 37.595524,
          lng: 126.828176,
          description: '임진왔란의 역사적 현장',
          popular: true,
          image: '/heritage/haengju.jpg',
          rating: 4.5,
          reviews: 5670,
          openTime: '09:00 - 18:00',
          price: '무료',
          category: '산성',
          address: '경기도 고양시 덕양구 행주로 15번길 89',
          region: '경기'
        },
        {
          id: 23,
          name: '연천 전곡리 유적',
          lat: 38.014096,
          lng: 127.060172,
          description: '구석기 시대 유적',
          popular: false,
          image: '/heritage/jeongok.jpg',
          rating: 4.2,
          reviews: 1890,
          openTime: '09:00 - 18:00',
          price: '2,000원',
          category: '선사유적',
          address: '경기도 연천군 전곡읍 평화로 443번길 2',
          region: '경기'
        },
        {
          id: 24,
          name: '선교장',
          lat: 37.786533,
          lng: 128.885210,
          description: '조선시대 대표 가옥',
          popular: true,
          image: '/heritage/seongyojang.jpg',
          rating: 4.6,
          reviews: 8920,
          openTime: '09:00 - 18:00',
          price: '9,000원',
          category: '가옥',
          address: '강원특별자치도 강릉시 운정길 63',
          region: '강릉'
        },
        {
          id: 25,
          name: '백제 역사 유적지구',
          lat: 36.463471,
          lng: 127.126703,
          description: '백제의 역사와 문화',
          popular: true,
          image: '/heritage/baekje.jpg',
          rating: 4.7,
          reviews: 12450,
          openTime: '09:00 - 18:00',
          price: '3,000원',
          category: '역사유적',
          address: '충청남도 공주시 금성동 산5-2',
          region: '충청'
        },
        {
          id: 26,
          name: '부여 정림사지',
          lat: 36.279221,
          lng: 126.913919,
          description: '백제의 사찰 유적',
          popular: false,
          image: '/heritage/jeongrimsa.jpg',
          rating: 4.4,
          reviews: 3450,
          openTime: '09:00 - 18:00',
          price: '1,500원',
          category: '사지',
          address: '충청남도 부여군 부여읍 정림로 83',
          region: '충청'
        },
        {
          id: 27,
          name: '공주 공산성',
          lat: 36.464623,
          lng: 127.124976,
          description: '백제의 왕성',
          popular: true,
          image: '/heritage/gongsanseong.jpg',
          rating: 4.6,
          reviews: 8920,
          openTime: '09:00 - 18:00',
          price: '1,200원',
          category: '산성',
          address: '충청남도 공주시 웅진로 280',
          region: '충청'
        },
        {
          id: 28,
          name: '보은 법주사',
          lat: 36.544000,
          lng: 127.833330,
          description: '대한불교 조계종 총본산',
          popular: true,
          image: '/heritage/beopjusa.jpg',
          rating: 4.8,
          reviews: 15670,
          openTime: '08:00 - 18:00',
          price: '4,000원',
          category: '사찰',
          address: '충청북도 보은군 속리산면 법주사로 405',
          region: '충청'
        },
        {
          id: 29,
          name: '충주 탑평리 칠층석탑',
          lat: 37.015820,
          lng: 127.866658,
          description: '고려시대 석탑',
          popular: false,
          image: '/heritage/tappyeong.jpg',
          rating: 4.3,
          reviews: 2340,
          openTime: '09:00 - 18:00',
          price: '무료',
          category: '석탑',
          address: '충청북도 충주시 중앙탑면 탑평리 11',
          region: '충청'
        },
        {
          id: 30,
          name: '담양 소쇄원',
          lat: 35.184197,
          lng: 127.012238,
          description: '조선시대 대표 정원',
          popular: true,
          image: '/heritage/soswaewon.jpg',
          rating: 4.7,
          reviews: 11230,
          openTime: '09:00 - 18:00',
          price: '2,000원',
          category: '정원',
          address: '전라남도 담양군 가사문학면 지곡길 17',
          region: '전라'
        },
        {
          id: 31,
          name: '화순 고인돌 유적',
          lat: 34.985092,
          lng: 126.918533,
          description: '선사시대 거석 문화',
          popular: false,
          image: '/heritage/hwasun.jpg',
          rating: 4.4,
          reviews: 3450,
          openTime: '09:00 - 18:00',
          price: '2,000원',
          category: '선사유적',
          address: '전라남도 화순군 도곡면 효산리 산76-1',
          region: '전라'
        },
        {
          id: 32,
          name: '남원 광한루원',
          lat: 35.403012,
          lng: 127.379312,
          description: '조선시대 대표 다리',
          popular: true,
          image: '/heritage/gwanghanru.jpg',
          rating: 4.6,
          reviews: 8920,
          openTime: '09:00 - 18:00',
          price: '3,000원',
          category: '다리',
          address: '전라북도 남원시 요천로 1447',
          region: '전라'
        },
        {
          id: 33,
          name: '전주 경기전',
          lat: 35.815295,
          lng: 127.149790,
          description: '조선 태조의 어진',
          popular: true,
          image: '/heritage/gyeonggijeon.jpg',
          rating: 4.5,
          reviews: 12450,
          openTime: '09:00 - 18:00',
          price: '3,000원',
          category: '어진',
          address: '전라북도 전주시 완산구 태조로 44',
          region: '전라'
        },
        {
          id: 34,
          name: '전동성당',
          lat: 35.813307,
          lng: 127.149233,
          description: '한국 최초의 서양식 성당',
          popular: false,
          image: '/heritage/jeondong.jpg',
          rating: 4.4,
          reviews: 5670,
          openTime: '09:00 - 18:00',
          price: '무료',
          category: '성당',
          address: '전라북도 전주시',
          region: '전라'
        },
        {
          id: 35,
          name: '대릉원',
          lat: 35.838168,
          lng: 129.210707,
          description: '신라 왕릉의 고분군',
          popular: true,
          image: '/heritage/daereungwon.jpg',
          rating: 4.7,
          reviews: 18920,
          openTime: '09:00 - 22:00',
          price: '3,000원',
          category: '고분',
          address: '경상북도 경주시 첫성로 9',
          region: '경주'
        }
      ]
    },
    touristSpot: {
      regional: [
        { 
          id: 101, 
          name: '남산타워', 
          lat: 37.5512, 
          lng: 126.9882,
          description: '서울의 랜드마크',
          popular: true,
          image: '/tourist/namsan_tower.jpg',
          rating: 4.4,
          reviews: 18920,
          openTime: '10:00 - 23:00',
          price: '16,000원',
          category: '전망대',
          address: '서울특별시 용산구 남산공원길 105',
          region: '서울'
        },
        { 
          id: 102, 
          name: '제주도 성산일출봉', 
          lat: 33.4584, 
          lng: 126.9424,
          description: '제주도의 대표 관광지',
          popular: true,
          image: '/tourist/seongsan.jpg',
          rating: 4.8,
          reviews: 34560,
          openTime: '07:00 - 20:00',
          price: '5,000원',
          category: '자연명소',
          address: '제주특별자치도 서귀포시 성산읍 성산리',
          region: '제주'
        },
        {
          id: 103,
          name: '북촌한옥마을',
          lat: 37.582513,
          lng: 126.985729,
          description: '서울의 전통 한옥마을',
          popular: true,
          image: '/tourist/bukchon.jpg',
          rating: 4.4,
          reviews: 28920,
          openTime: '24시간',
          price: '무료',
          category: '한옥마을',
          address: '서울특별시 종로구 계동',
          region: '서울'
        },
        {
          id: 104,
          name: '올림픽공원',
          lat: 37.520697,
          lng: 127.121565,
          description: '88올림픽의 추억이 담긴 공원',
          popular: false,
          image: '/tourist/olympic_park.jpg',
          rating: 4.3,
          reviews: 15670,
          openTime: '05:00 - 22:00',
          price: '무료',
          category: '공원',
          address: '서울특별시 송파구 올림픽로',
          region: '서울'
        },
        {
          id: 105,
          name: '서울숲',
          lat: 37.544824,
          lng: 127.039283,
          description: '도심 속 자연 휴식공간',
          popular: true,
          image: '/tourist/seoul_forest.jpg',
          rating: 4.5,
          reviews: 22340,
          openTime: '24시간',
          price: '무료',
          category: '공원',
          address: '서울특별시 성동구 뚝섬로',
          region: '서울'
        },
        {
          id: 106,
          name: '한국민속촌',
          lat: 37.258862,
          lng: 127.118068,
          description: '전통문화 체험 테마파크',
          popular: true,
          image: '/tourist/folk_village.jpg',
          rating: 4.6,
          reviews: 18920,
          openTime: '09:30 - 18:30',
          price: '20,000원',
          category: '테마파크',
          address: '경기도 용인시 기흥구',
          region: '용인'
        },
        {
          id: 107,
          name: '에버랜드',
          lat: 37.294220,
          lng: 127.201780,
          description: '국내 최대 테마파크',
          popular: true,
          image: '/tourist/everland.jpg',
          rating: 4.7,
          reviews: 45670,
          openTime: '10:00 - 22:00',
          price: '62,000원',
          category: '테마파크',
          address: '경기도 용인시 처인구',
          region: '용인'
        },
        {
          id: 108,
          name: '남이섬',
          lat: 37.789881,
          lng: 127.525814,
          description: '겨울연가의 촬영지',
          popular: true,
          image: '/tourist/nami_island.jpg',
          rating: 4.5,
          reviews: 32100,
          openTime: '07:30 - 21:40',
          price: '16,000원',
          category: '섬',
          address: '강원도 춘천시 남산면',
          region: '춘천'
        },
        {
          id: 109,
          name: '정동진',
          lat: 37.691101,
          lng: 129.034019,
          description: '해돋이 명소',
          popular: false,
          image: '/tourist/jeongdongjin.jpg',
          rating: 4.4,
          reviews: 12450,
          openTime: '24시간',
          price: '무료',
          category: '해변',
          address: '강원도 강릉시 강동면',
          region: '강릉'
        },
        {
          id: 110,
          name: '순천만',
          lat: 34.882725,
          lng: 127.513855,
          description: '갈대밭과 철새의 천국',
          popular: true,
          image: '/tourist/suncheon_bay.jpg',
          rating: 4.8,
          reviews: 25670,
          openTime: '08:00 - 19:00',
          price: '8,000원',
          category: '습지',
          address: '전라남도 순천시 순천만길',
          region: '순천'
        }
      ],
      detailed: [
        { 
          id: 111, 
          name: '한강공원', 
          lat: 37.5219, 
          lng: 127.0411,
          description: '서울 시민의 휴식처',
          popular: true,
          image: '/tourist/hangang_park.jpg',
          rating: 4.3,
          reviews: 12340,
          openTime: '24시간',
          price: '무료',
          category: '공원',
          address: '서울특별시 영등포구 여의동로 330',
          region: '서울'
        },
        { 
          id: 112, 
          name: '명동', 
          lat: 37.5636, 
          lng: 126.9834,
          description: '쇼핑과 맛집의 거리',
          popular: true,
          image: '/tourist/myeongdong.jpg',
          rating: 4.2,
          reviews: 25670,
          openTime: '10:00 - 22:00',
          price: '무료',
          category: '쇼핑거리',
          address: '서울특별시 중구 명동2가',
          region: '서울'
        },
        {
          id: 139,
          name: '뚝섬',
          lat: 37.529256,
          lng: 127.069888,
          description: '한강변 레저공간',
          popular: false,
          image: '/tourist/ttukseom.jpg',
          rating: 4.2,
          reviews: 5670,
          openTime: '24시간',
          price: '무료',
          category: '공원',
          address: '서울시 성동구 자동차시장길 49',
          region: '서울'
        },

        {
          id: 113,
          name: '경포호',
          lat: 37.797737,
          lng: 128.908580,
          description: '강릉의 대표 호수',
          popular: false,
          image: '/tourist/gyeongpo.jpg',
          rating: 4.3,
          reviews: 8920,
          openTime: '24시간',
          price: '무료',
          category: '호수',
          address: '강원도 강릉시 운정동',
          region: '강릉'
        },
        {
          id: 114,
          name: '부산 감천문화마을',
          lat: 35.097372,
          lng: 129.011292,
          description: '산토리니를 닮은 마을',
          popular: true,
          image: '/tourist/gamcheon.jpg',
          rating: 4.6,
          reviews: 34560,
          openTime: '09:00 - 18:00',
          price: '무료',
          category: '문화마을',
          address: '부산광역시 사하구 감내2로',
          region: '부산'
        },
        {
          id: 115,
          name: '통영 동피랑 벽화마을',
          lat: 34.845607,
          lng: 128.427653,
          description: '아름다운 벽화가 있는 마을',
          popular: false,
          image: '/tourist/dongpirang.jpg',
          rating: 4.4,
          reviews: 12340,
          openTime: '24시간',
          price: '무료',
          category: '벽화마을',
          address: '경상남도 통영시 동호동',
          region: '통영'
        },
        {
          id: 116,
          name: '새빛섬',
          lat: 37.511706,
          lng: 126.994915,
          description: '한강 위의 인공섬',
          popular: true,
          image: '/tourist/floating_island.jpg',
          rating: 4.4,
          reviews: 8920,
          openTime: '24시간',
          price: '무료',
          category: '공원',
          address: '서울시 서초구 신반포로 11',
          region: '서울'
        },
        {
          id: 117,
          name: '석촌호수',
          lat: 37.509358,
          lng: 127.098197,
          description: '도심 속 호수공원',
          popular: true,
          image: '/tourist/seokchon_lake.jpg',
          rating: 4.3,
          reviews: 15670,
          openTime: '24시간',
          price: '무료',
          category: '호수',
          address: '서울시 송파구 잠실동 47',
          region: '서울'
        },
        {
          id: 118,
          name: '서대문독립공원',
          lat: 37.575244,
          lng: 126.955082,
          description: '독립운동 역사의 현장',
          popular: false,
          image: '/tourist/independence_park.jpg',
          rating: 4.5,
          reviews: 6780,
          openTime: '09:00 - 18:00',
          price: '무료',
          category: '공원',
          address: '서울시 서대문구 통일로 251',
          region: '서울'
        },
        {
          id: 119,
          name: '어린이대공원',
          lat: 37.548957,
          lng: 127.081541,
          description: '가족 나들이 명소',
          popular: true,
          image: '/tourist/childrens_park.jpg',
          rating: 4.5,
          reviews: 23450,
          openTime: '05:00 - 22:00',
          price: '무료',
          category: '공원',
          address: '서울시 광진구 능동로 216',
          region: '서울'
        },
        {
          id: 120,
          name: '평화누리공원',
          lat: 37.892156,
          lng: 126.743081,
          description: 'DMZ 평화의 상징',
          popular: false,
          image: '/tourist/peace_nuri.jpg',
          rating: 4.3,
          reviews: 5670,
          openTime: '09:00 - 18:00',
          price: '무료',
          category: '공원',
          address: '경기도 파주시',
          region: '경기'
        },
        {
          id: 121,
          name: '통일전망대',
          lat: 37.772959,
          lng: 126.677277,
          description: '분단의 현실을 보는 곳',
          popular: true,
          image: '/tourist/unification.jpg',
          rating: 4.4,
          reviews: 8920,
          openTime: '09:00 - 17:00',
          price: '3,000원',
          category: '전망대',
          address: '경기도 파주시',
          region: '경기'
        },
        {
          id: 122,
          name: '광명동굴',
          lat: 37.426448,
          lng: 126.866432,
          description: '신비로운 지하 동굴 세계',
          popular: true,
          image: '/tourist/gwangmyeong_cave.jpg',
          rating: 4.6,
          reviews: 15670,
          openTime: '09:00 - 18:00',
          price: '6,000원',
          category: '동굴',
          address: '경기도 광명시',
          region: '경기'
        },
        {
          id: 123,
          name: '벽초지 문화수목원',
          lat: 37.800752,
          lng: 126.873854,
          description: '아름다운 수목원',
          popular: false,
          image: '/tourist/byeokchoji.jpg',
          rating: 4.5,
          reviews: 6780,
          openTime: '09:00 - 18:00',
          price: '9,000원',
          category: '수목원',
          address: '경기도 파주시',
          region: '경기'
        },
        {
          id: 124,
          name: '고성왕곡마을',
          lat: 38.340206,
          lng: 128.499996,
          description: '전통 마을의 모습',
          popular: false,
          image: '/tourist/wanggok.jpg',
          rating: 4.2,
          reviews: 3450,
          openTime: '09:00 - 18:00',
          price: '2,000원',
          category: '마을',
          address: '강원도 고성군',
          region: '강원'
        },
        {
          id: 125,
          name: '대관령 하늘목장',
          lat: 37.705737,
          lng: 128.719792,
          description: '고원의 아름다운 목장',
          popular: true,
          image: '/tourist/sky_ranch.jpg',
          rating: 4.7,
          reviews: 12450,
          openTime: '09:00 - 18:00',
          price: '9,000원',
          category: '목장',
          address: '강원도 평창군',
          region: '강원'
        },
        {
          id: 126,
          name: '대청호반길',
          lat: 36.477580,
          lng: 127.480683,
          description: '아름다운 호수 둥레길',
          popular: true,
          image: '/tourist/daecheong_lake.jpg',
          rating: 4.5,
          reviews: 8920,
          openTime: '24시간',
          price: '무료',
          category: '둥래길',
          address: '대전광역시',
          region: '대전'
        },
        {
          id: 127,
          name: '성심당',
          lat: 36.327680,
          lng: 127.427348,
          description: '대전의 대표 베이커리',
          popular: true,
          image: '/tourist/sungsimdang.jpg',
          rating: 4.6,
          reviews: 25670,
          openTime: '07:00 - 22:00',
          price: '무료',
          category: '베이커리',
          address: '대전광역시',
          region: '대전'
        },
        {
          id: 128,
          name: '한밭수목원',
          lat: 36.366780,
          lng: 127.388940,
          description: '도심 속 대형 수목원',
          popular: false,
          image: '/tourist/hanbat.jpg',
          rating: 4.4,
          reviews: 11230,
          openTime: '05:00 - 22:00',
          price: '무료',
          category: '수목원',
          address: '대전광역시',
          region: '대전'
        },
        {
          id: 129,
          name: '단양 도담삼봉',
          lat: 37.000028,
          lng: 128.343939,
          description: '남한강의 아름다운 기암',
          popular: true,
          image: '/tourist/dodamsambong.jpg',
          rating: 4.8,
          reviews: 18920,
          openTime: '24시간',
          price: '무료',
          category: '자연명소',
          address: '충청북도 단양군',
          region: '충청'
        },
        {
          id: 130,
          name: '청남대',
          lat: 36.461736,
          lng: 127.489183,
          description: '대통령 별장',
          popular: true,
          image: '/tourist/cheongnamdae.jpg',
          rating: 4.6,
          reviews: 15670,
          openTime: '09:00 - 18:00',
          price: '5,000원',
          category: '별장',
          address: '충청북도 청주시',
          region: '충청'
        },
        {
          id: 131,
          name: '대청호 명상정원',
          lat: 36.380649,
          lng: 127.482542,
          description: '평화로운 정원',
          popular: false,
          image: '/tourist/meditation_garden.jpg',
          rating: 4.3,
          reviews: 5670,
          openTime: '09:00 - 18:00',
          price: '3,000원',
          category: '정원',
          address: '충청북도 청주시',
          region: '충청'
        },
        {
          id: 132,
          name: '보령 대천해수욕장',
          lat: 36.395521,
          lng: 126.516062,
          description: '서해안의 대표 해수욕장',
          popular: true,
          image: '/tourist/daecheon.jpg',
          rating: 4.4,
          reviews: 23450,
          openTime: '24시간',
          price: '무료',
          category: '해수욕장',
          address: '충청남도 보령시',
          region: '충청'
        },
        {
          id: 133,
          name: '태안 신두리 해안사구',
          lat: 36.845091,
          lng: 126.196728,
          description: '자연이 만든 모래언덕',
          popular: false,
          image: '/tourist/sinduri.jpg',
          rating: 4.5,
          reviews: 6780,
          openTime: '24시간',
          price: '무료',
          category: '자연명소',
          address: '충청남도 태안군',
          region: '충청'
        },
        {
          id: 134,
          name: '순천 낙안읍성',
          lat: 34.907252,
          lng: 127.341107,
          description: '조선시대 읍성',
          popular: true,
          image: '/tourist/nagan.jpg',
          rating: 4.7,
          reviews: 12450,
          openTime: '09:00 - 18:00',
          price: '4,000원',
          category: '읍성',
          address: '전라남도 순천시',
          region: '전라'
        },
        {
          id: 135,
          name: '고창 읍성',
          lat: 35.431931,
          lng: 126.703830,
          description: '고창의 역사적 읍성',
          popular: false,
          image: '/tourist/gochang.jpg',
          rating: 4.4,
          reviews: 5670,
          openTime: '09:00 - 18:00',
          price: '2,000원',
          category: '읍성',
          address: '전라북도 고창군',
          region: '전라'
        },
        {
          id: 136,
          name: '경주 동궁과 월지',
          lat: 35.834797,
          lng: 129.226577,
          description: '신라 왕궁의 연못',
          popular: true,
          image: '/tourist/donggung.jpg',
          rating: 4.8,
          reviews: 21340,
          openTime: '09:00 - 22:00',
          price: '3,000원',
          category: '역사유적',
          address: '경상북도 경주시',
          region: '경주'
        },
        {
          id: 137,
          name: '포항 스페이스워크',
          lat: 36.065054,
          lng: 129.390418,
          description: '우주항공과학관',
          popular: false,
          image: '/tourist/space_walk.jpg',
          rating: 4.5,
          reviews: 8920,
          openTime: '09:30 - 17:30',
          price: '7,000원',
          category: '과학관',
          address: '경상북도 포항시',
          region: '경상'
        },
        {
          id: 138,
          name: '울산 태화강 국가정원',
          lat: 35.547826,
          lng: 129.296105,
          description: '도심 속 아름다운 정원',
          popular: true,
          image: '/tourist/taehwa.jpg',
          rating: 4.6,
          reviews: 15670,
          openTime: '05:00 - 22:00',
          price: '무료',
          category: '정원',
          address: '울산광역시',
          region: '경상'
        }
      ]
    },
    experienceCenter: {
      regional: [
        { 
          id: 201, 
          name: '국립중앙박물관', 
          lat: 37.5240, 
          lng: 126.9803,
          description: '한국 역사와 문화 체험',
          popular: true,
          image: '/experience/national_museum.jpg',
          rating: 4.7,
          reviews: 18920,
          openTime: '10:00 - 18:00',
          price: '무료',
          category: '박물관',
          address: '서울특별시 용산구 서빙고로 137',
          region: '서울'
        }
      ],
      detailed: [
        { 
          id: 202, 
          name: '서울역사박물관', 
          lat: 37.5707, 
          lng: 126.9697,
          description: '서울의 역사 체험',
          popular: false,
          image: '/experience/seoul_museum.jpg',
          rating: 4.4,
          reviews: 7650,
          openTime: '09:00 - 18:00',
          price: '무료',
          category: '박물관',
          address: '서울특별시 종로구 새문안로 55',
          region: '서울'
        },
        { 
          id: 203, 
          name: '국립민속박물관', 
          lat: 37.5796, 
          lng: 126.9770,
          description: '한국 전통 문화 체험',
          popular: true,
          image: '/experience/folk_museum.jpg',
          rating: 4.5,
          reviews: 11230,
          openTime: '09:00 - 18:00',
          price: '무료',
          category: '박물관',
          address: '서울특별시 종로구 삼청로 37',
          region: '서울'
        },
        { 
          id: 204, 
          name: '전쟁기념관', 
          lat: 37.5341, 
          lng: 126.9777,
          description: '한국 전쟁사 체험',
          popular: false,
          image: '/experience/war_memorial.jpg',
          rating: 4.6,
          reviews: 9870,
          openTime: '09:00 - 18:00',
          price: '무료',
          category: '기념관',
          address: '서울특별시 용산구 이태원로 29',
          region: '서울'
        },
        { 
          id: 205, 
          name: '국립과천과학관', 
          lat: 37.4344, 
          lng: 126.9969,
          description: '과학 기술 체험',
          popular: true,
          image: '/experience/science_museum.jpg',
          rating: 4.8,
          reviews: 16540,
          openTime: '09:30 - 17:30',
          price: '4,000원',
          category: '과학관',
          address: '경기도 과천시 상하벌로 110',
          region: '경기'
        },
        {
          id: 206,
          name: '한국사찰음식문화체험관',
          lat: 37.576052,
          lng: 126.983828,
          description: '전통 사찰음식 체험',
          popular: false,
          image: '/experience/temple_food.jpg',
          rating: 4.5,
          reviews: 3450,
          openTime: '10:00 - 17:00',
          price: '15,000원',
          category: '체험관',
          address: '서울특별시 종로구 우정국로',
          region: '서울'
        },
        {
          id: 207,
          name: '남산골 한옥마을',
          lat: 37.559276,
          lng: 126.994419,
          description: '도심 속 전통 한옥 체험',
          popular: true,
          image: '/experience/namsangol.jpg',
          rating: 4.4,
          reviews: 12450,
          openTime: '09:00 - 21:00',
          price: '무료',
          category: '한옥체험',
          address: '서울특별시 중구 퇴계로',
          region: '서울'
        },
        {
          id: 208,
          name: '떡 박물관',
          lat: 37.574871,
          lng: 126.990637,
          description: '한국 전통 떡 문화 체험',
          popular: false,
          image: '/experience/rice_cake_museum.jpg',
          rating: 4.2,
          reviews: 2340,
          openTime: '10:00 - 17:00',
          price: '5,000원',
          category: '박물관',
          address: '서울특별시 종로구 와룡동',
          region: '서울'
        },
        {
          id: 209,
          name: '북촌전통공예체험관',
          lat: 37.582424,
          lng: 126.986027,
          description: '전통 공예 체험',
          popular: false,
          image: '/experience/bukchon_craft.jpg',
          rating: 4.3,
          reviews: 1890,
          openTime: '09:00 - 18:00',
          price: '10,000원',
          category: '체험관',
          address: '서울특별시 종로구 계동',
          region: '서울'
        },
        {
          id: 210,
          name: '안성팜랜드',
          lat: 36.992021,
          lng: 127.193397,
          description: '농촌 체험 테마파크',
          popular: true,
          image: '/experience/anseong_farm.jpg',
          rating: 4.6,
          reviews: 15670,
          openTime: '10:00 - 18:00',
          price: '12,000원',
          category: '농촌체험',
          address: '경기도 안성시 공도읍',
          region: '안성'
        },
        {
          id: 211,
          name: '국립중앙과학관',
          lat: 36.375778,
          lng: 127.375916,
          description: '과학기술의 모든 것',
          popular: true,
          image: '/experience/daejeon_science.jpg',
          rating: 4.7,
          reviews: 22340,
          openTime: '09:30 - 17:30',
          price: '2,000원',
          category: '과학관',
          address: '대전광역시 유성구 대덕대로',
          region: '대전'
        },
        {
          id: 212,
          name: '화폐박물관',
          lat: 36.377506,
          lng: 127.370477,
          description: '화폐의 역사와 문화',
          popular: false,
          image: '/experience/currency_museum.jpg',
          rating: 4.4,
          reviews: 5670,
          openTime: '10:00 - 17:00',
          price: '무료',
          category: '박물관',
          address: '대전광역시 유성구 가정로',
          region: '대전'
        },
        {
          id: 213,
          name: '임실치즈테마파크',
          lat: 35.632731,
          lng: 127.301278,
          description: '치즈 만들기 체험',
          popular: true,
          image: '/experience/imsil_cheese.jpg',
          rating: 4.5,
          reviews: 8920,
          openTime: '10:00 - 17:00',
          price: '8,000원',
          category: '체험관',
          address: '전라북도 임실군 성수면',
          region: '임실'
        },
        {
          id: 214,
          name: '국립농업박물관',
          lat: 37.276165,
          lng: 126.982126,
          description: '농업의 역사와 문화',
          popular: false,
          image: '/experience/agriculture_museum.jpg',
          rating: 4.3,
          reviews: 3450,
          openTime: '09:00 - 18:00',
          price: '무료',
          category: '박물관',
          address: '경기도 수원시',
          region: '경기'
        },
        {
          id: 215,
          name: '파주 DMZ 생생 누리',
          lat: 37.890497,
          lng: 126.740686,
          description: 'DMZ 체험 공간',
          popular: true,
          image: '/experience/dmz_nuri.jpg',
          rating: 4.4,
          reviews: 6780,
          openTime: '09:00 - 18:00',
          price: '5,000원',
          category: '체험관',
          address: '경기도 파주시',
          region: '경기'
        },
        {
          id: 216,
          name: '연천 전곡리 선사박물관',
          lat: 38.114960,
          lng: 127.063685,
          description: '구석기 시대 선사문화',
          popular: false,
          image: '/experience/jeongok_museum.jpg',
          rating: 4.2,
          reviews: 2340,
          openTime: '09:00 - 18:00',
          price: '2,000원',
          category: '박물관',
          address: '경기도 연천군',
          region: '경기'
        },
        {
          id: 217,
          name: '영월 우구정가옥',
          lat: 37.205318,
          lng: 128.378038,
          description: '전통 가옥 체험',
          popular: false,
          image: '/experience/ugujeong.jpg',
          rating: 4.1,
          reviews: 1890,
          openTime: '09:00 - 18:00',
          price: '3,000원',
          category: '체험관',
          address: '강원도 영월군',
          region: '강원'
        },
        {
          id: 218,
          name: '원주 한지테마파크',
          lat: 37.334327,
          lng: 127.935471,
          description: '전통 한지 만들기 체험',
          popular: true,
          image: '/experience/hanji_park.jpg',
          rating: 4.5,
          reviews: 5670,
          openTime: '09:00 - 18:00',
          price: '4,000원',
          category: '체험관',
          address: '강원도 원주시',
          region: '강원'
        },
        {
          id: 219,
          name: '한국전통음식문화체험관 정강원',
          lat: 37.570270,
          lng: 128.407972,
          description: '전통 음식 체험',
          popular: false,
          image: '/experience/jeonggangwon.jpg',
          rating: 4.3,
          reviews: 3450,
          openTime: '10:00 - 17:00',
          price: '12,000원',
          category: '체험관',
          address: '강원도 강릉시',
          region: '강원'
        },
        {
          id: 220,
          name: '도계유리나라',
          lat: 37.193986,
          lng: 129.032316,
          description: '유리공예 체험',
          popular: false,
          image: '/experience/glass_country.jpg',
          rating: 4.2,
          reviews: 2340,
          openTime: '09:00 - 18:00',
          price: '8,000원',
          category: '체험관',
          address: '강원도 삼척시',
          region: '강원'
        },
        {
          id: 221,
          name: '대전 동춘당',
          lat: 36.364790,
          lng: 127.441208,
          description: '조선시대 사랑방',
          popular: false,
          image: '/experience/dongchundang.jpg',
          rating: 4.1,
          reviews: 1890,
          openTime: '09:00 - 18:00',
          price: '1,000원',
          category: '역사관',
          address: '대전광역시',
          region: '대전'
        },
        {
          id: 222,
          name: '한국지질자원연구원 지질박물관',
          lat: 37.377512,
          lng: 127.362457,
          description: '지구의 역사와 지질',
          popular: false,
          image: '/experience/geology_museum.jpg',
          rating: 4.3,
          reviews: 2340,
          openTime: '09:00 - 17:00',
          price: '무료',
          category: '박물관',
          address: '대전광역시',
          region: '대전'
        },
        {
          id: 223,
          name: '부여 백제문화단지',
          lat: 36.307243,
          lng: 126.906623,
          description: '백제 문화 체험',
          popular: true,
          image: '/experience/baekje_complex.jpg',
          rating: 4.6,
          reviews: 8920,
          openTime: '09:00 - 18:00',
          price: '6,000원',
          category: '체험관',
          address: '충청남도 부여군',
          region: '충청'
        },
        {
          id: 224,
          name: '보령 석탄박물관',
          lat: 36.333330,
          lng: 126.611110,
          description: '석탄의 역사와 문화',
          popular: false,
          image: '/experience/coal_museum.jpg',
          rating: 4.2,
          reviews: 3450,
          openTime: '09:00 - 18:00',
          price: '2,000원',
          category: '박물관',
          address: '충청남도 보령시',
          region: '충청'
        },
        {
          id: 225,
          name: '서천 국립생태원',
          lat: 36.030096,
          lng: 126.723435,
          description: '생태계 체험 공간',
          popular: true,
          image: '/experience/ecology_center.jpg',
          rating: 4.7,
          reviews: 15670,
          openTime: '09:30 - 17:00',
          price: '5,000원',
          category: '체험관',
          address: '충청남도 서천군',
          region: '충청'
        },
        {
          id: 226,
          name: '단양 활옥동굴',
          lat: 36.961404,
          lng: 128.007038,
          description: '신비로운 동굴 탐험',
          popular: false,
          image: '/experience/hwalgok_cave.jpg',
          rating: 4.4,
          reviews: 5670,
          openTime: '09:00 - 17:00',
          price: '11,000원',
          category: '동굴',
          address: '충청북도 단양군',
          region: '충청'
        },
        {
          id: 227,
          name: '담양 죽향문화체험마을',
          lat: 35.329670,
          lng: 126.985662,
          description: '대나무 문화 체험',
          popular: false,
          image: '/experience/bamboo_village.jpg',
          rating: 4.3,
          reviews: 3450,
          openTime: '09:00 - 18:00',
          price: '3,000원',
          category: '체험관',
          address: '전라남도 담양군',
          region: '전라'
        },
        {
          id: 228,
          name: '고창 상하농원',
          lat: 35.447264,
          lng: 126.451621,
          description: '친환경 농업 체험',
          popular: true,
          image: '/experience/sangha_farm.jpg',
          rating: 4.5,
          reviews: 8920,
          openTime: '10:00 - 18:00',
          price: '8,000원',
          category: '체험관',
          address: '전라북도 고창군',
          region: '전라'
        },
        {
          id: 229,
          name: '순천 낙안읍성 민속마을',
          lat: 34.907284,
          lng: 127.341159,
          description: '전통 민속 체험',
          popular: false,
          image: '/experience/nagan_folk.jpg',
          rating: 4.2,
          reviews: 5670,
          openTime: '09:00 - 18:00',
          price: '4,000원',
          category: '체험관',
          address: '전라남도 순천시',
          region: '전라'
        },
        {
          id: 230,
          name: '청도 와인터널',
          lat: 35.714421,
          lng: 128.720334,
          description: '와인 양조 체험',
          popular: false,
          image: '/experience/wine_tunnel.jpg',
          rating: 4.3,
          reviews: 6780,
          openTime: '09:00 - 18:00',
          price: '7,000원',
          category: '체험관',
          address: '경상북도 청도군',
          region: '경상'
        },
        {
          id: 231,
          name: '양산 통도사 템플스테이',
          lat: 35.482780,
          lng: 129.057495,
          description: '사찰 수행 체험',
          popular: true,
          image: '/experience/tongdosa.jpg',
          rating: 4.6,
          reviews: 11230,
          openTime: '09:00 - 18:00',
          price: '20,000원',
          category: '체험관',
          address: '경상남도 양산시',
          region: '경상'
        },
        {
          id: 232,
          name: '김해 가야테마파크',
          lat: 35.250719,
          lng: 128.893173,
          description: '가야 문화 체험',
          popular: false,
          image: '/experience/gaya_park.jpg',
          rating: 4.4,
          reviews: 8920,
          openTime: '09:00 - 18:00',
          price: '6,000원',
          category: '체험관',
          address: '경상남도 김해시',
          region: '경상'
        }
      ]
    }
  };
  // 두 지점 간의 거리 계산 함수 (Haversine formula)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // 지구의 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  };

  // 거리 정보가 포함된 데이터 반환
  const getDataWithDistance = (data) => {
    if (!userLocation || !data) return data || [];
    
    return data.map(place => {
      const distanceValue = calculateDistance(
        userLocation.lat, 
        userLocation.lng, 
        place.lat, 
        place.lng
      );
      
      return {
        ...place,
        distance: distanceValue,
        calculatedDistance: distanceValue
      };
    });
  };

  // RDS 데이터를 표준 형식으로 변환하는 함수
  const normalizeRDSData = (rdsItem) => {
    console.log('🔄 RDS 데이터 정규화 시작:', rdsItem.title || rdsItem.name);
    console.log('🔍 원본 데이터:', rdsItem);
    console.log('🔍 content_id 확인:', rdsItem.content_id, typeof rdsItem.content_id);
    console.log('🔍 id 확인:', rdsItem.id, typeof rdsItem.id);
    
    // ID 결정 로직 개선
    let finalId = null;
    
    // content_id가 있으면 무조건 사용 (문자열로 변환)
    if (rdsItem.content_id) {
      finalId = String(rdsItem.content_id);
      console.log('✅ content_id 사용:', finalId);
    }
    // content_id가 없고 id가 6자리 이상이면 사용
    else if (rdsItem.id && String(rdsItem.id).length >= 6) {
      finalId = String(rdsItem.id);
      console.log('✅ 6자리 이상 id 사용:', finalId);
    }
    // 그 외의 경우 작은 ID로 처리
    else {
      finalId = String(rdsItem.id || '1');
      console.log('⚠️ 작은 ID 사용:', finalId, '(원본:', rdsItem.id, ')');
    }
    
    // 좌표 처리 개선
    const lat = parseFloat(rdsItem.latitude || rdsItem.lat || rdsItem.mapy || 0);
    const lng = parseFloat(rdsItem.longitude || rdsItem.lng || rdsItem.mapx || 0);
    
    console.log('📍 좌표 처리:', {
      title: rdsItem.title,
      원본_latitude: rdsItem.latitude,
      원본_longitude: rdsItem.longitude,
      처리된_lat: lat,
      처리된_lng: lng,
      유효성: lat !== 0 && lng !== 0
    });
    
    const normalized = {
      id: finalId, // 최종 처리된 ID
      content_id: rdsItem.content_id, // 원본 content_id 보존
      originalId: rdsItem.id, // 원본 id 보존
      rawData: rdsItem, // 원본 데이터 전체 보존
      name: rdsItem.title || rdsItem.name || '제목 없음',
      title: rdsItem.title || rdsItem.name || '제목 없음',
      description: rdsItem.overview || rdsItem.description || '상세 정보가 없습니다.',
      image: rdsItem.image_url || rdsItem.image || '/image/default-tourist-spot.jpg',
      lat: lat,
      lng: lng,
      latitude: lat,
      longitude: lng,
      address: rdsItem.address || '주소 정보 없음',
      area_name: rdsItem.area_name || '',
      area_code: rdsItem.area_code || 0,
      spot_category: rdsItem.spot_category || '',
      unesco: rdsItem.unesco || false,
      tel: rdsItem.tel || '',
      homepage: rdsItem.homepage || '',
      info_center: rdsItem.info_center || '',
      rest_date: rdsItem.rest_date || '',
      use_time: rdsItem.use_time || '',
      parking: rdsItem.parking || '',
      facilities: rdsItem.facilities || [],
      distance: rdsItem.distance ? (parseFloat(rdsItem.distance) < 1 ? `${Math.round(parseFloat(rdsItem.distance) * 1000)}m` : `${parseFloat(rdsItem.distance).toFixed(1)}km`) : 0,
      popular: true,
      rating: 4.5,
      reviews: 1000
    };
    
    console.log('🔄 정규화 완료:', {
      name: normalized.name,
      finalId: normalized.id,
      content_id: normalized.content_id,
      originalId: normalized.originalId,
      hasContentId: !!rdsItem.content_id
    });
    
    return normalized;
  };

  // 헬퍼 함수들 - 거리 계산 포함
  const getCurrentData = () => {
    const categoryInfo = categoryData[selectedCategory];
    let displayData = [];
    
    console.log('🔍 getCurrentData 호출:');
    console.log('  - selectedCategory:', selectedCategory);
    console.log('  - rdsData.length:', rdsData.length);
    console.log('  - experienceData.length:', experienceData.length);
    console.log('  - unescoData.length:', unescoData.length);
    console.log('  - isLoadingRDS:', isLoadingRDS);
    console.log('  - currentGPS:', currentGPS);
    
    // RDS 데이터가 있으면 직접 사용 (이미 백엔드에서 카테고리별로 필터링됨)
    if (rdsData.length > 0) {
      displayData = rdsData
        .map(item => normalizeRDSData(item))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 50);
      
      console.log('✅ RDS 데이터 사용:', displayData.length, '개');
      console.log('  - 첫 번째 아이템:', displayData[0]?.title || displayData[0]?.name);
      console.log('  - 카테고리 분포:', displayData.reduce((acc, item) => {
        const cat = item.spot_category || 'unknown';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {}));
    } else {
      // RDS 데이터가 없거나 로딩 중일 때만 빈 배열 반환
      displayData = [];
      
      console.log('⚠️ RDS 데이터 없음 또는 로딩 중');
    }

    // 중복 제거 (같은 이름이나 같은 좌표의 데이터 제거)
    const uniqueData = displayData.filter((item, index, self) => {
      return index === self.findIndex(t => (
        (t.title || t.name) === (item.title || item.name) || 
        (Math.abs((t.lat || t.latitude) - (item.lat || item.latitude)) < 0.001 && 
         Math.abs((t.lng || t.longitude) - (item.lng || item.longitude)) < 0.001)
      ));
    });

    console.log(`📊 중복 제거: ${displayData.length}개 → ${uniqueData.length}개`);
    
    return getDataWithDistance(uniqueData);
  };

  const getAllData = () => {
    // RDS 데이터가 있으면 우선 사용
    if (rdsData.length > 0) {
      return getCurrentData(); // RDS 데이터 사용
    }
    
    // RDS 데이터가 없으면 빈 배열 반환 (하드코딩된 데이터 사용 안 함)
    console.log('⚠️ RDS 데이터 없음, 빈 배열 반환');
    return [];
  };

  const getNearbyPlaces = () => {
    const allData = getAllData();
    if (allData.length === 0) return [];
    
    // 거리순으로 정렬하여 가장 가까운 5개 반환
    return allData
      .sort((a, b) => {
        // calculatedDistance가 없으면 기본값 사용
        const distanceA = a.calculatedDistance ? parseFloat(a.calculatedDistance) : 999;
        const distanceB = b.calculatedDistance ? parseFloat(b.calculatedDistance) : 999;
        return distanceA - distanceB;
      })
      .slice(0, 5);
  };

  // 지역별 유네스코 데이터 가져오기 (RDS 데이터에서 필터링)
  const getUnescoByRegion = () => {
    const regions = {
      '서울/경기': [1, 31],      // 서울(1), 경기(31)
      '충청도': [33, 34],        // 충북(33), 충남(34)
      '전라도': [37, 38],        // 전북(37), 전남(38)
      '강원도': [32],            // 강원(32)
      '경상도': [35, 36],        // 경북(35), 경남(36)
      '제주도': [39]             // 제주(39)
    };

    const regionData = {};
    
    // UNESCO 전용 데이터 사용 (이미 unesco=true인 데이터만 포함)
    let sourceData = [];
    if (unescoData.length > 0) {
      sourceData = unescoData.map(item => normalizeRDSData(item));
    }

    console.log('📊 UNESCO 전용 데이터 사용:', sourceData.length, '개');

    // area_code 기준으로 지역별 분류
    Object.keys(regions).forEach(regionName => {
      const areaCodes = regions[regionName];
      regionData[regionName] = sourceData
        .filter(item => {
          const areaCode = parseInt(item.area_code);
          return areaCodes.includes(areaCode);
        })
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    });

    console.log('📊 area_code 기준 지역별 UNESCO 데이터:', regionData);
    return regionData;
  };

  // 현재 선택된 지역의 UNESCO 데이터
  const [selectedRegion, setSelectedRegion] = useState('서울/경기');
  const regionUnescoData = getUnescoByRegion();
  const currentRegionData = regionUnescoData[selectedRegion] || [];

  const getPopularPlaces = () => {
    // 현재 선택된 지역의 UNESCO 데이터 반환
    return currentRegionData;
  };

  // 기존 마커들 제거
  const clearMarkers = () => {
    markers.forEach(marker => {
      marker.setMap(null);
    });
    setMarkers([]);
  };

  // 마커 추가
  const addMarkers = (kakaoMap) => {
    const currentData = getCurrentData();
    const newMarkers = [];
    
    console.log(`🗺️ 줌 레벨 ${mapLevel}에서 ${currentData.length}개 마커 표시 시작`);
    console.log('📍 현재 데이터 샘플:', currentData.slice(0, 3));
    
    currentData.forEach((place, index) => {
      // 좌표 확인 - 다양한 필드명 지원
      const lat = place.lat || place.latitude || place.mapy;
      const lng = place.lng || place.longitude || place.mapx;
      
      console.log(`📍 마커 ${index + 1}: ${place.name || place.title}`, {
        lat: lat,
        lng: lng,
        originalLat: place.latitude,
        originalLng: place.longitude,
        rawData: place
      });
      
      if (!lat || !lng || lat === 0 || lng === 0) {
        console.warn('⚠️ 좌표 없음 또는 0:', place.name || place.title, { lat, lng });
        return;
      }

      try {
        // 카테고리별 마커 이미지 설정
        let markerImageSrc = null;
        const category = place.spot_category || place.category;
        
        switch(category) {
          case '문화재':
            markerImageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png';
            break;
          case '관광지':
            markerImageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_blue.png';
            break;
          case '문화시설':
            markerImageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_green.png';
            break;
          default:
            markerImageSrc = null; // 기본 마커 사용
        }
        
        console.log(`🎨 마커 ${index + 1} 카테고리:`, category, '이미지:', markerImageSrc);
        
        // 마커 옵션 설정
        const markerOptions = {
          position: new window.kakao.maps.LatLng(lat, lng),
          map: kakaoMap
        };
        
        // 카테고리별 이미지가 있으면 적용
        if (markerImageSrc) {
          const imageSize = new window.kakao.maps.Size(24, 35);
          const markerImage = new window.kakao.maps.MarkerImage(markerImageSrc, imageSize);
          markerOptions.image = markerImage;
        }
        
        const marker = new window.kakao.maps.Marker(markerOptions);

        // 마커 클릭 이벤트
        window.kakao.maps.event.addListener(marker, 'click', function() {
          console.log('🖱️ 마커 클릭:', place.name || place.title);
          setSelectedPlace(place);
        });

        newMarkers.push(marker);
        console.log(`✅ 마커 ${index + 1} 생성 성공:`, place.name || place.title);
      } catch (error) {
        console.error(`❌ 마커 ${index + 1} 생성 실패:`, error, place);
      }
    });
    
    console.log(`🎯 총 ${newMarkers.length}개 마커 생성 완료`);
    setMarkers(newMarkers);
  };

  // 카카오 지도 초기화
  useEffect(() => {
    console.log('🎯 지도 초기화 useEffect 실행:', { viewMode, mapRef: mapRef.current });
    
    if (viewMode === 'map') {
      console.log('✅ 지도 모드 활성화, 지도 초기화 시작...');
      
      // 카카오 API 로드 확인
      const initMap = () => {
        console.log('🗺️ 지도 초기화 시작...');
        
        if (!window.kakao || !window.kakao.maps) {
          console.error('❌ 카카오 지도 API가 로드되지 않았습니다.');
          return;
        }

        const container = mapRef.current;
        console.log('🔍 지도 컨테이너 확인:', container);
        console.log('🔍 컨테이너 크기:', container ? `${container.offsetWidth}x${container.offsetHeight}` : 'null');
        
        if (!container) {
          console.error('❌ 지도 컨테이너를 찾을 수 없습니다.');
          return;
        }

        // 컨테이너가 DOM에 렌더링되었는지 확인
        if (container.offsetWidth === 0 || container.offsetHeight === 0) {
          console.warn('⚠️ 지도 컨테이너 크기가 0입니다. 잠시 후 재시도...');
          setTimeout(() => {
            console.log('🔄 지도 초기화 재시도...');
            initMap();
          }, 100);
          return;
        }

        // 기존 지도가 있으면 제거
        if (map) {
          console.log('🔄 기존 지도 제거 중...');
        }

        try {
          // 컨테이너 크기 확인 및 설정
          container.style.width = '100%';
          container.style.minHeight = '400px';
          
          const options = {
            center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울 중심으로 변경
            level: 8, // 적절한 줌 레벨로 조정
            scrollwheel: true,
            disableDoubleClick: false,
            disableDoubleClickZoom: false
          };
          
          console.log('🗺️ 지도 생성 중...', options);
          const kakaoMap = new window.kakao.maps.Map(container, options);
          setMap(kakaoMap);
          console.log('✅ 카카오 지도 초기화 성공');

          // 지도 레벨 변경 이벤트 (디바운스 적용)
          let levelChangeTimeout;
          window.kakao.maps.event.addListener(kakaoMap, 'zoom_changed', function() {
            clearTimeout(levelChangeTimeout);
            levelChangeTimeout = setTimeout(() => {
              const level = kakaoMap.getLevel();
              console.log('Map level changed to:', level);
              setMapLevel(level);
            }, 100); // 100ms 디바운스
          });

          // 지도 이동 이벤트
          window.kakao.maps.event.addListener(kakaoMap, 'center_changed', function() {
            const level = kakaoMap.getLevel();
            setMapLevel(level); // 이동시에도 마커 업데이트를 위해 줌 레벨 재설정
          });

          // 사용자 위치가 있으면 사용자 위치 마커 추가
          if (userLocation) {
            const userMarker = new window.kakao.maps.Marker({
              position: new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng),
              map: kakaoMap
            });

            // 사용자 위치 정보창
            const userInfoWindow = new window.kakao.maps.InfoWindow({
              content: '<div style="padding:5px;font-size:12px;">현재 위치</div>'
            });
            userInfoWindow.open(kakaoMap, userMarker);
          }

          // 마커 추가
          addMarkers(kakaoMap);

          // 지도 크기 재조정
          setTimeout(() => {
            kakaoMap.relayout();
          }, 100);

        } catch (error) {
          console.error('지도 초기화 중 오류:', error);
        }
      };

      // 카카오 API가 로드될 때까지 대기
      if (window.kakao && window.kakao.maps) {
        console.log('✅ 카카오 API 이미 로드됨, 지도 초기화 시작');
        setTimeout(initMap, 100); // 약간의 지연 후 초기화
      } else {
        console.log('⏳ 카카오 API 로딩 대기 중...');
        let attempts = 0;
        const maxAttempts = 100; // 10초 대기
        
        const checkInterval = setInterval(() => {
          attempts++;
          console.log(`🔍 카카오 API 확인 시도 ${attempts}/${maxAttempts}`);
          
          if (window.kakao && window.kakao.maps) {
            console.log('✅ 카카오 API 로드 완료!');
            clearInterval(checkInterval);
            setTimeout(initMap, 100);
          } else if (attempts >= maxAttempts) {
            console.error('❌ 카카오 API 로딩 타임아웃');
            clearInterval(checkInterval);
          }
        }, 100);

        // 10초 후 타임아웃
        setTimeout(() => {
          clearInterval(checkInterval);
          console.error('카카오 지도 API 로드 타임아웃');
        }, 10000);
      }
    }
  }, [viewMode, selectedCategory, userLocation]);

  // 지도 레벨 변경 시 마커 업데이트
  useEffect(() => {
    if (map && viewMode === 'map') {
      clearMarkers();
      addMarkers(map);
    }
  }, [mapLevel]);

  const categoryButtons = [
    { key: 'culturalHeritage', label: t.culturalHeritage, image: '/image/museum.png' },
    { key: 'touristSpot', label: t.touristSpot, image: '/image/tour.png' },
    { key: 'experienceCenter', label: t.experienceCenter, image: '/image/exp.png' }
  ];
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'auto' // 전체 페이지 스크롤 허용
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '15px 20px',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0
      }}>
        <button 
          onClick={() => navigate('/main')}
          style={{
            position: 'absolute',
            left: '20px',
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#333'
          }}
        >
          ←
        </button>
        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{t.stampCollection}</span>
      </div>

      {/* Category Buttons */}
      <div style={{
        backgroundColor: 'white',
        padding: '15px 20px',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        gap: '10px',
        flexShrink: 0
      }}>
        {categoryButtons.map(button => (
          <button
            key={button.key}
            onClick={() => {
              setSelectedCategory(button.key);
              setSelectedPlace(null); // 카테고리 변경 시 선택된 장소 초기화
            }}
            style={{
              flex: 1,
              padding: '12px 10px',
              border: selectedCategory === button.key ? '2px solid #4CAF50' : '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: selectedCategory === button.key ? '#e8f5e8' : 'white',
              color: selectedCategory === button.key ? '#4CAF50' : '#333',
              fontWeight: selectedCategory === button.key ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              minHeight: '70px'
            }}
          >
            <img 
              src={button.image} 
              alt={button.label}
              style={{
                width: '32px',
                height: '32px',
                objectFit: 'contain',
                marginBottom: '2px'
              }}
            />
            {button.label}
          </button>
        ))}
      </div>

      {/* View Mode Switch */}
      <div style={{
        backgroundColor: 'white',
        padding: '10px 20px',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <span style={{ fontSize: '14px', color: '#666' }}>
          {getCurrentData().length}{language === 'ko' ? '개의 장소' : ' places'} ({language === 'ko' ? '레벨' : 'Level'} {mapLevel})
          {isLoadingRDS && (
            <span style={{ marginLeft: '8px', color: '#007AFF' }}>
              🔄 RDS 데이터 로딩중...
            </span>
          )}

        </span>
        <div style={{
          display: 'flex',
          backgroundColor: '#f0f0f0',
          borderRadius: '20px',
          padding: '2px'
        }}>
          <button
            onClick={() => {
              setViewMode('map');
              setSelectedPlace(null);
            }}
            style={{
              padding: '6px 12px',
              border: 'none',
              borderRadius: '18px',
              backgroundColor: viewMode === 'map' ? '#4CAF50' : 'transparent',
              color: viewMode === 'map' ? 'white' : '#666',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {t.mapView}
          </button>
          <button
            onClick={() => {
              setViewMode('list');
              setSelectedPlace(null);
            }}
            style={{
              padding: '6px 12px',
              border: 'none',
              borderRadius: '18px',
              backgroundColor: viewMode === 'list' ? '#4CAF50' : 'transparent',
              color: viewMode === 'list' ? 'white' : '#666',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {t.listView}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflow: 'visible', position: 'relative', paddingBottom: '70px' }}>
        {/* Map View - 목록 모드일 때 숨김 */}
        <div 
          ref={mapRef}
          style={{ 
            width: '100%', 
            height: 'calc(100vh - 180px)', // 헤더와 하단 네비게이션 고려한 높이
            minHeight: '250px', // 최소 높이를 더 작게 조정
            position: 'relative',
            display: viewMode === 'map' ? 'block' : 'none',
            backgroundColor: '#f0f0f0' // 디버깅을 위한 배경색
          }}
        >
          {viewMode === 'map' && (
            <>
              {/* 지도 로딩 중 표시 */}
              {!map && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  zIndex: 1000,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>🗺️</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>{language === 'ko' ? '지도 로딩 중...' : 'Loading map...'}</div>
                </div>
              )}
            
              {/* Selected Place Card - 하단 메뉴바를 침범하지 않도록 수정 */}
              {selectedPlace && (
                <div style={{
                  position: 'absolute',
                  bottom: '80px', // 네비게이션 바 위에 충분한 간격
                  left: '20px',
                  right: '20px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                  zIndex: 1000,
                  height: '80px' // 고정 높이로 작게 설정
                }}>
                  <div style={{ display: 'flex', height: '80px' }}>
                    {/* Image */}
                    <div style={{ width: '80px', flexShrink: 0 }}>
                      <img 
                        src={selectedPlace.image || selectedPlace.first_image || selectedPlace.image_url || '/image/default-tourist-spot.jpg'}
                        alt={selectedPlace.name || selectedPlace.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          console.log('🖼️ 상세 모달 이미지 로드 실패:', e.target.src);
                          e.target.src = '/image/default-tourist-spot.jpg';
                        }}
                      />
                    </div>
                    
                    {/* Info */}
                    <div style={{ 
                      flex: 1, 
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minWidth: 0
                    }}>
                      {/* Top Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ 
                            margin: 0, 
                            fontSize: '13px', 
                            fontWeight: 'bold',
                            color: '#333',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {selectedPlace.name || selectedPlace.title || '이름 없음'}
                          </h3>
                          <p style={{
                            margin: '2px 0',
                            fontSize: '10px',
                            color: '#666',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {selectedPlace.address || selectedPlace.addr1 || selectedPlace.description || '주소 정보 없음'}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedPlace(null)}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '14px',
                            cursor: 'pointer',
                            color: '#999',
                            padding: '0',
                            marginLeft: '8px',
                            flexShrink: 0
                          }}
                        >
                          ×
                        </button>
                      </div>
                      
                      {/* Bottom Row */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end',
                        alignItems: 'center'
                      }}>
                        <button
                          onClick={() => handlePlaceClick(selectedPlace)}
                          style={{
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '9px',
                            cursor: 'pointer'
                          }}
                        >
                          {language === 'ko' ? '상세보기' : 'Details'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* List View - 지도 모드일 때 숨김 */}
        <div style={{ 
          display: viewMode === 'list' ? 'flex' : 'none',
          height: '100%', 
          flexDirection: 'column',
          backgroundColor: '#f5f5f5'
        }}>
          {/* List View Content - MainPage 스타일과 유사하게 */}
          <div style={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            backgroundColor: '#f5f5f5'
          }}>
            {/* Nearby Places */}
            <div style={{ 
              flex: 1, 
              padding: '15px 20px',
              backgroundColor: 'white',
              marginBottom: '8px'
            }}>
              <h3 style={{ 
                margin: '0 0 15px 0', 
                fontSize: '16px', 
                fontWeight: 'bold',
                color: '#333'
              }}>
                📍 {t.nearbyPlaces}
                {getNearbyPlaces().length > 0 && (
                  <span style={{ 
                    marginLeft: '8px', 
                    fontSize: '14px', 
                    color: '#666',
                    fontWeight: 'normal'
                  }}>
                    (거리순 5개)
                  </span>
                )}

              </h3>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                maxHeight: 'calc(50vh - 80px)',
                overflowY: 'auto'
              }}>
                {getNearbyPlaces().length > 0 ? (
                  getNearbyPlaces().map(place => (
                    <div 
                      key={place.id}
                      style={{
                        display: 'flex',
                        padding: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        backgroundColor: '#f9f9f9',
                        cursor: 'pointer'
                      }}
                      onClick={() => handlePlaceClick(place)}
                    >
                      <img 
                        src={place.image || place.first_image || place.image_url || '/image/default-tourist-spot.jpg'}
                        alt={place.name || place.title}
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '6px',
                          objectFit: 'cover',
                          marginRight: '12px'
                        }}
                        onError={(e) => {
                          console.log('🖼️ 가까운 곳 이미지 로드 실패:', e.target.src);
                          e.target.src = '/image/default-tourist-spot.jpg';
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start',
                          marginBottom: '4px'
                        }}>
                          <h4 style={{ 
                            margin: 0, 
                            fontSize: '14px', 
                            fontWeight: 'bold',
                            color: '#333'
                          }}>
                            {place.name || place.title || '이름 없음'}
                          </h4>
                          <span style={{ 
                            fontSize: '12px', 
                            color: '#4CAF50',
                            fontWeight: 'bold'
                          }}>
                            {place.distance || '계산 중...'}
                          </span>
                        </div>
                        <p style={{ 
                          margin: '0 0 4px 0', 
                          fontSize: '12px', 
                          color: '#666',
                          lineHeight: '1.4'
                        }}>
                          {place.address || place.addr1 || place.description || '주소 정보 없음'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#666'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>
                      {isLoadingRDS ? '🔄' : '📍'}
                    </div>
                    <div>
                      {isLoadingRDS 
                        ? (language === 'ko' ? 'RDS에서 관광지 정보를 불러오는 중...' : 'Loading tourist spots from RDS...') 
                        : (language === 'ko' ? '가까운 장소를 찾고 있습니다...' : 'Finding nearby places...')
                      }
                    </div>
                    {rdsData.length === 0 && !isLoadingRDS && (
                      <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
                        {language === 'ko' ? 'GPS 위치를 확인하고 있습니다.' : 'Checking GPS location.'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Popular Places */}
            <div style={{ 
              flex: 1, 
              padding: '15px 20px',
              backgroundColor: 'white'
            }}>
              <h3 style={{ 
                margin: '0 0 15px 0', 
                fontSize: '16px', 
                fontWeight: 'bold',
                color: '#333'
              }}>
                🏛️ 유네스코 세계유산
                {currentRegionData.length > 0 && (
                  <span style={{ 
                    marginLeft: '8px', 
                    fontSize: '14px', 
                    color: '#666',
                    fontWeight: 'normal'
                  }}>
                    ({selectedRegion}: {currentRegionData.length}개)
                  </span>
                )}

              </h3>
              
              {/* 지역 선택 토글 */}
              <div style={{
                display: 'flex',
                overflowX: 'auto',
                gap: '8px',
                padding: '10px 0',
                marginBottom: '10px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
                {Object.keys(regionUnescoData).filter(region => region !== '부산').map(region => (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    style={{
                      minWidth: '80px',
                      padding: '8px 12px',
                      borderRadius: '20px',
                      border: selectedRegion === region ? '2px solid #4CAF50' : '1px solid #ddd',
                      backgroundColor: selectedRegion === region ? '#e8f5e8' : 'white',
                      color: selectedRegion === region ? '#4CAF50' : '#666',
                      fontSize: '12px',
                      fontWeight: selectedRegion === region ? 'bold' : 'normal',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {region}
                    {regionUnescoData[region] && regionUnescoData[region].length > 0 && (
                      <span style={{ marginLeft: '4px', fontSize: '10px' }}>
                        ({regionUnescoData[region].length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                maxHeight: 'calc(50vh - 120px)',
                overflowY: 'auto'
              }}>
                {currentRegionData.length > 0 ? (
                  currentRegionData.map(place => (
                    <div 
                      key={place.id}
                      style={{
                        display: 'flex',
                        padding: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        backgroundColor: '#fff8e1',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      onClick={() => handlePlaceClick(place)}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        backgroundColor: '#ff9800',
                        color: 'white',
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontWeight: 'bold'
                      }}>
                        UNESCO
                      </div>
                      <img 
                        src={place.image || place.first_image || place.image_url || '/image/default-tourist-spot.jpg'}
                        alt={place.name || place.title}
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '6px',
                          objectFit: 'cover',
                          marginRight: '12px'
                        }}
                        onError={(e) => {
                          console.log('🖼️ 유네스코 이미지 로드 실패:', e.target.src);
                          e.target.src = '/image/default-tourist-spot.jpg';
                        }}
                      />
                      <div style={{ flex: 1, paddingRight: '40px' }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start',
                          marginBottom: '4px'
                        }}>
                          <h4 style={{ 
                            margin: 0, 
                            fontSize: '14px', 
                            fontWeight: 'bold',
                            color: '#333'
                          }}>
                            {place.title || place.name || '이름 없음'}
                          </h4>
                          <span style={{ 
                            fontSize: '12px', 
                            color: '#666'
                          }}>
                            {place.distance || '계산 중...'}
                          </span>
                        </div>
                        <p style={{ 
                          margin: '0 0 4px 0', 
                          fontSize: '12px', 
                          color: '#666',
                          lineHeight: '1.4'
                        }}>
                          {place.address || place.addr1 || '주소 정보 없음'}
                        </p>
                        {place.info_center && (
                          <p style={{ 
                            margin: '0', 
                            fontSize: '11px', 
                            color: '#007AFF',
                            lineHeight: '1.4'
                          }}>
                            📞 {place.info_center}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#666'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>🏛️</div>
                    <div>{language === 'ko' ? '유네스코 세계유산을 찾고 있습니다...' : 'Finding UNESCO World Heritage Sites...'}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="nav-bar">
        <div 
          className="nav-item"
          onClick={() => navigate('/main')} // 홈으로 이동
          style={{ cursor: 'pointer' }}
        >
          <div 
            className="nav-icon" 
            style={{ backgroundImage: 'url(/image/home.png)' }}
          ></div>
          <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{language === 'ko' ? '홈' : 'Home'}</span>
        </div>
        <div 
          className="nav-item"
          onClick={() => navigate('/camera')}
          style={{ 
            cursor: 'pointer',
            transform: language === 'en' ? 'translateX(5px)' : 'translateX(0px)'
          }}
        >
          <div 
            className="nav-icon" 
            style={{ backgroundImage: 'url(/image/nav_camera.png)' }}
          ></div>
          <span style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{language === 'ko' ? '사진찍기' : 'Camera'}</span>
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
          <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{language === 'ko' ? '설정' : 'Settings'}</span>
        </div>
      </div>

      {/* 상세 정보 모달 */}
      {showDetailModal && selectedPlaceDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            {/* 모달 헤더 */}
            <div style={{
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              borderBottom: '1px solid #eee',
              padding: '15px 20px',
              borderRadius: '12px 12px 0 0'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  {selectedPlaceDetail.name || selectedPlaceDetail.title}
                </h3>
                <button
                  onClick={closeDetailModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#666',
                    padding: '0',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* 모달 내용 */}
            <div style={{ padding: '20px' }}>
              {/* 이미지 */}
              <img
                src={selectedPlaceDetail.image || '/image/default-tourist-spot.jpg'}
                alt={selectedPlaceDetail.name || selectedPlaceDetail.title}
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  marginBottom: '15px'
                }}
                onError={(e) => {
                  e.target.src = '/image/default-tourist-spot.jpg';
                }}
              />

              {/* 기본 정보 */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{
                  fontSize: '14px',
                  color: '#666',
                  marginBottom: '5px'
                }}>
                  📍 {selectedPlaceDetail.address || '주소 정보 없음'}
                </div>
                {selectedPlaceDetail.distance && (
                  <div style={{
                    fontSize: '14px',
                    color: '#28a745',
                    marginBottom: '5px'
                  }}>
                    📏 거리: {selectedPlaceDetail.distance}
                  </div>
                )}
                {selectedPlaceDetail.tel && (
                  <div style={{
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '5px'
                  }}>
                    📞 {selectedPlaceDetail.tel}
                  </div>
                )}
              </div>

              {/* 개요/설명 */}
              {selectedPlaceDetail.description && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: '10px'
                  }}>
                    📖 개요
                  </h4>
                  <p style={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#555',
                    margin: 0
                  }}>
                    {selectedPlaceDetail.description}
                  </p>
                </div>
              )}

              {/* 추가 정보 */}
              {(selectedPlaceDetail.use_time || selectedPlaceDetail.rest_date || selectedPlaceDetail.parking) && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: '10px'
                  }}>
                    ℹ️ 이용 정보
                  </h4>
                  {selectedPlaceDetail.use_time && (
                    <div style={{
                      fontSize: '14px',
                      color: '#666',
                      marginBottom: '5px'
                    }}>
                      🕒 이용시간: {selectedPlaceDetail.use_time}
                    </div>
                  )}
                  {selectedPlaceDetail.rest_date && (
                    <div style={{
                      fontSize: '14px',
                      color: '#666',
                      marginBottom: '5px'
                    }}>
                      🚫 휴무일: {selectedPlaceDetail.rest_date}
                    </div>
                  )}
                  {selectedPlaceDetail.parking && (
                    <div style={{
                      fontSize: '14px',
                      color: '#666',
                      marginBottom: '5px'
                    }}>
                      🚗 주차: {selectedPlaceDetail.parking}
                    </div>
                  )}
                </div>
              )}

              {/* 액션 버튼들 */}
              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '20px'
              }}>
                <button
                  onClick={() => goToDetailPage(selectedPlaceDetail)}
                  style={{
                    flex: 1,
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  상세 페이지로 이동
                </button>
                <button
                  onClick={closeDetailModal}
                  style={{
                    flex: 1,
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StampPage;
