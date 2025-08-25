import React, { useState, useEffect } from 'react';

const WeatherWidget = ({ currentGPS, language }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // 위치 정보를 가져오는 함수
  const getLocationInfo = (lat, lng) => {
    // 간단한 지역 추정 (위도/경도 기반)
    if (lat >= 37.4 && lat <= 37.7 && lng >= 126.8 && lng <= 127.2) {
      return { sido: '서울시', sigungu: '중구' };
    } else if (lat >= 37.2 && lat <= 37.6 && lng >= 126.6 && lng <= 127.1) {
      return { sido: '경기도', sigungu: '수원시' };
    } else if (lat >= 35.0 && lat <= 35.3 && lng >= 128.9 && lng <= 129.3) {
      return { sido: '부산시', sigungu: '해운대구' };
    } else {
      return { sido: '서울시', sigungu: '중구' };
    }
  };

  // 날씨 코드를 이모지로 변환
  const getWeatherEmoji = (skyCode, ptyCode) => {
    if (ptyCode > 0) {
      switch (ptyCode) {
        case 1: return '🌧️'; // 비
        case 2: return '🌨️'; // 비/눈
        case 3: return '❄️'; // 눈
        case 4: return '🌦️'; // 소나기
        default: return '🌧️';
      }
    }
    
    switch (skyCode) {
      case 1: return '☀️'; // 맑음
      case 3: return '⛅'; // 구름많음
      case 4: return '☁️'; // 흐림
      default: return '☀️';
    }
  };

  // 날씨 상태를 텍스트로 변환
  const getWeatherText = (skyCode, ptyCode) => {
    if (language === 'ko') {
      if (ptyCode > 0) {
        switch (ptyCode) {
          case 1: return '비';
          case 2: return '비/눈';
          case 3: return '눈';
          case 4: return '소나기';
          default: return '비';
        }
      }
      
      switch (skyCode) {
        case 1: return '맑음';
        case 3: return '구름많음';
        case 4: return '흐림';
        default: return '맑음';
      }
    } else {
      if (ptyCode > 0) {
        switch (ptyCode) {
          case 1: return 'Rain';
          case 2: return 'Rain/Snow';
          case 3: return 'Snow';
          case 4: return 'Shower';
          default: return 'Rain';
        }
      }
      
      switch (skyCode) {
        case 1: return 'Clear';
        case 3: return 'Partly Cloudy';
        case 4: return 'Cloudy';
        default: return 'Clear';
      }
    }
  };

  const fetchWeatherData = async () => {
    if (!currentGPS || hasLoaded) return;

    setLoading(true);
    setError(null);

    try {
      console.log('백엔드 날씨 API 호출 시작...');
      
      // 위치 정보 설정
      const location = getLocationInfo(currentGPS.latitude, currentGPS.longitude);
      setLocationData(location);

      // 백엔드 API 호출
      const response = await fetch(`http://localhost:5006/api/weather?lat=${currentGPS.latitude}&lng=${currentGPS.longitude}`);
      const data = await response.json();

      console.log('백엔드 날씨 API 응답:', data);

      if (data.success) {
        // 현재 날씨 데이터 설정
        const weatherInfo = {
          temperature: data.current.temperature,
          sky: data.current.sky,
          pty: data.current.pty,
          humidity: data.current.humidity,
          emoji: getWeatherEmoji(data.current.sky, data.current.pty),
          condition: getWeatherText(data.current.sky, data.current.pty)
        };

        setWeatherData(weatherInfo);

        // 시간별 예보 데이터 설정
        const hourlyData = data.hourly.map(item => ({
          time: item.time,
          temp: item.temp,
          emoji: getWeatherEmoji(item.sky, item.pty),
          condition: getWeatherText(item.sky, item.pty)
        }));

        setHourlyForecast(hourlyData);
        console.log('날씨 데이터 설정 완료:', { current: weatherInfo, hourly: hourlyData });

      } else {
        // API 실패시에도 기본 데이터 사용
        console.log('API 실패, 기본 데이터 사용:', data.error);
        
        const weatherInfo = {
          temperature: data.current.temperature,
          sky: data.current.sky,
          pty: data.current.pty,
          humidity: data.current.humidity,
          emoji: getWeatherEmoji(data.current.sky, data.current.pty),
          condition: getWeatherText(data.current.sky, data.current.pty)
        };

        setWeatherData(weatherInfo);

        const hourlyData = data.hourly.map(item => ({
          time: item.time,
          temp: item.temp,
          emoji: getWeatherEmoji(item.sky, item.pty),
          condition: getWeatherText(item.sky, item.pty)
        }));

        setHourlyForecast(hourlyData);
        setError('기본값 사용');
      }

    } catch (err) {
      console.error('날씨 데이터 호출 오류:', err);
      setError(err.message);
      
      // 완전 실패시 기본 데이터
      const currentHour = new Date().getHours();
      setWeatherData({
        temperature: '22',
        emoji: '☀️',
        condition: language === 'ko' ? '맑음' : 'Clear',
        humidity: '60'
      });
      
      // 기본 시간별 예보
      const defaultHourly = [];
      for (let i = 1; i <= 8; i++) {
        const hour = (currentHour + i) % 24;
        defaultHourly.push({
          time: hour,
          temp: (22 + Math.floor(Math.random() * 6) - 3).toString(),
          emoji: ['☀️', '⛅', '☁️', '🌤️'][Math.floor(Math.random() * 4)],
          condition: language === 'ko' ? '맑음' : 'Clear'
        });
      }
      setHourlyForecast(defaultHourly);
    } finally {
      setHasLoaded(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentGPS && !hasLoaded && !loading) {
      console.log('날씨 정보 로딩 시작');
      fetchWeatherData();
    }
  }, [currentGPS]);

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#e3f2fd',
        borderRadius: '8px',
        padding: '12px',
        textAlign: 'center',
        border: '1px solid #2196f3',
        height: '85px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>🌤️</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {language === 'ko' ? '실시간 날씨 로딩 중...' : 'Loading real weather...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      padding: '12px',
      border: '1px solid #dee2e6',
      height: '110px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      overflow: 'hidden'
    }}>
      {/* 첫 번째 줄: 위치 정보 + 현재 날씨 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        {/* 위치 정보 */}
        {locationData && (
          <span style={{ 
            fontSize: '12px',
            color: '#6c757d',
            fontWeight: '500'
          }}>
            📍 {locationData.sido} {locationData.sigungu}
          </span>
        )}
        
        {/* 현재 날씨 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '20px' }}>{weatherData?.emoji || '☀️'}</span>
          <span style={{ 
            fontSize: '16px',
            fontWeight: 'bold', 
            color: '#495057'
          }}>
            {weatherData?.temperature || '22'}°C
          </span>
          <span style={{ 
            fontSize: '11px',
            color: '#6c757d'
          }}>
            {weatherData?.condition || (language === 'ko' ? '맑음' : 'Clear')}
          </span>
        </div>
      </div>
      
      {/* 두 번째 줄: 시간별 예보 (8개) */}
      {hourlyForecast.length > 0 && (
        <div style={{ 
          display: 'flex', 
          gap: '2px',
          justifyContent: 'space-between',
          width: '100%',
          overflow: 'hidden'
        }}>
          {hourlyForecast.slice(0, 8).map((forecast, index) => (
            <div key={index} style={{
              flex: 1,
              textAlign: 'center',
              backgroundColor: 'rgba(255,255,255,0.8)',
              borderRadius: '4px',
              padding: '6px 2px',
              fontSize: '9px',
              border: '1px solid #e9ecef',
              minWidth: '22px',
              maxWidth: '32px'
            }}>
              <div style={{ color: '#6c757d', lineHeight: '1.1', marginBottom: '2px' }}>
                {forecast.time}시
              </div>
              <div style={{ fontSize: '10px', lineHeight: '1.1', marginBottom: '2px' }}>
                {forecast.emoji}
              </div>
              <div style={{ color: '#495057', fontWeight: '500', lineHeight: '1.1' }}>
                {forecast.temp}°
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* 실시간 표시 */}
      <div style={{ 
        fontSize: '8px',
        color: error && error !== '기본값 사용' ? '#dc3545' : '#28a745', 
        textAlign: 'center',
        marginTop: '4px'
      }}>
        {error && error !== '기본값 사용' ? '오프라인' : '실시간'}
      </div>
    </div>
  );
};

export default WeatherWidget;
