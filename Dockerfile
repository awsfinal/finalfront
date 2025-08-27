# 멀티 스테이지 빌드
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci

# 소스 코드 복사
COPY . .

# 프로덕션 빌드
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/nginx.conf

# 빌드된 파일 복사
COPY --from=builder /app/build /usr/share/nginx/html

# 권한 설정
RUN chmod -R 755 /usr/share/nginx/html

# 포트 노출 (80과 8080 모두)
EXPOSE 80 8080

# 헬스체크 (포트 80)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Nginx 시작 (root 사용자로 실행)
CMD ["nginx", "-g", "daemon off;"]
