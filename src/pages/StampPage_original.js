import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { translations, getLanguage, setLanguage as saveLanguage } from '../utils/translations';
import { initializeFontSize } from '../utils/fontSizeUtils';

function StampPage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('ko');
  const [selectedCategory, setSelectedCategory] = useState('culturalHeritage');
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false); // 상세 정보 모달 표시 상태
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState(null); // 선택된 장소의 상세 정보
  const [mapLevel, setMapLevel] = useState(10); // 최대 축소 레벨
  const [markers, setMarkers] = useState([]);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  
  // RDS 연동을 위한 상태 추가
  const [nearbyTouristSpots, setNearbyTouristSpots] = useState([]);
  const [loading, setLoading] = useState(false);
  
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

  // 사용자 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          // RDS 데이터 가져오기
          fetchNearbyTouristSpots(location.lat, location.lng);
        },
        (error) => {
          console.error('위치 정보를 가져올 수 없습니다:', error);
          // 기본 위치 (서울시청)
          const defaultLocation = {
            lat: 37.5665,
            lng: 126.9780
          };
          setUserLocation(defaultLocation);
          // RDS 데이터 가져오기
          fetchNearbyTouristSpots(defaultLocation.lat, defaultLocation.lng);
        }
      );
    } else {
      // 기본 위치 설정
      const defaultLocation = {
        lat: 37.5665,
        lng: 126.9780
      };
      setUserLocation(defaultLocation);
      // RDS 데이터 가져오기
      fetchNearbyTouristSpots(defaultLocation.lat, defaultLocation.lng);
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
          image: '/image/jjikgeo_icon.png',
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
          image: '/image/jjikgeo_icon.png',
          rating: 4.9,
          reviews: 23450,
          openTime: '07:00 - 18:00',
          price: '6,000원',
          category: '사찰',
          address: '경상북도 경주시 불국로 385',
          region: '경주'
        }
      ],
      detailed: []
    }
  };

export default StampPage;
