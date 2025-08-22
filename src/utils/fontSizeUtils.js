// 글씨 크기 관련 유틸리티 함수들

export const getFontSize = () => {
  return localStorage.getItem('fontSize') || 'medium';
};

export const applyFontSize = (size) => {
  const root = document.documentElement;
  switch(size) {
    case 'small':
    case '작게':
      root.style.setProperty('--base-font-size', '12px');
      root.style.setProperty('--title-font-size', '16px');
      root.style.setProperty('--large-font-size', '18px');
      root.style.setProperty('--small-font-size', '10px');
      break;
    case 'large':
    case '크게':
      root.style.setProperty('--base-font-size', '18px');
      root.style.setProperty('--title-font-size', '22px');
      root.style.setProperty('--large-font-size', '24px');
      root.style.setProperty('--small-font-size', '16px');
      break;
    default: // medium, 보통
      root.style.setProperty('--base-font-size', '14px');
      root.style.setProperty('--title-font-size', '18px');
      root.style.setProperty('--large-font-size', '20px');
      root.style.setProperty('--small-font-size', '12px');
      break;
  }
  
  // 글씨 크기 변경 이벤트 발생
  window.dispatchEvent(new CustomEvent('fontSizeChanged', { detail: { size } }));
};

export const initializeFontSize = () => {
  const savedFontSize = getFontSize();
  applyFontSize(savedFontSize);
  return savedFontSize;
};

export const setFontSize = (size) => {
  localStorage.setItem('fontSize', size);
  applyFontSize(size);
};
