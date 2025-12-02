<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'

const router = useRouter()
const route = useRoute()

// URL에서 받은 사용자 ID
const userId = ref(null)

// 더미 데이터 - 다른 사용자 정보
const userInfo = ref({
  name: '이영희',
  nickname: '헬스매니아',
  email: 'younghee@yamyam.com'
})

// 팔로우 상태
const isFollowing = ref(false)

// 더미 데이터 - 팔로워/팔로잉 수
const followStats = ref({
  followers: 12,
  following: 8
})

// 더미 데이터 - 신체 정보 이력 (공개 설정된 경우만 표시)
const bodySpecs = ref([
  { id: 1, height: 165, weight: 58, age: 25, gender: '여성', date: '2025-01-01' },
  { id: 2, height: 165, weight: 57, age: 25, gender: '여성', date: '2025-01-08' },
  { id: 3, height: 165, weight: 56, age: 25, gender: '여성', date: '2025-01-15' },
  { id: 4, height: 165, weight: 55, age: 25, gender: '여성', date: '2025-01-22' },
  { id: 5, height: 165, weight: 54, age: 25, gender: '여성', date: '2025-01-29' },
])

// 토스트
const showToast = ref(false)
const toastMessage = ref('')

// 최신 신체 정보
const latestBodySpec = computed(() => {
  if (bodySpecs.value.length === 0) return null
  return [...bodySpecs.value].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
})

// BMI 계산
const bmi = computed(() => {
  if (!latestBodySpec.value) return 0
  const heightM = latestBodySpec.value.height / 100
  return (latestBodySpec.value.weight / (heightM * heightM)).toFixed(1)
})

// BMI 상태
const bmiStatus = computed(() => {
  const bmiValue = parseFloat(bmi.value)
  if (bmiValue < 18.5) return { text: '저체중', color: '#2196F3' }
  if (bmiValue < 23) return { text: '정상', color: '#4CAF50' }
  if (bmiValue < 25) return { text: '과체중', color: '#FFA726' }
  return { text: '비만', color: '#F44336' }
})

// 그래프 데이터 (최근 10개)
const chartData = computed(() => {
  const sorted = [...bodySpecs.value].sort((a, b) => new Date(a.date) - new Date(b.date))
  return sorted.slice(-10)
})

// 그래프 관련 계산
const chartWidth = 800
const chartHeight = 300
const chartPadding = { top: 20, right: 40, bottom: 60, left: 60 }

const weightRange = computed(() => {
  if (chartData.value.length === 0) return { min: 0, max: 100 }
  const weights = chartData.value.map(d => d.weight)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const padding = (max - min) * 0.2 || 5
  return {
    min: Math.floor(min - padding),
    max: Math.ceil(max + padding)
  }
})

// 좌표 계산
const getX = (index) => {
  const dataWidth = chartWidth - chartPadding.left - chartPadding.right
  return chartPadding.left + (dataWidth / (chartData.value.length - 1 || 1)) * index
}

const getY = (weight) => {
  const dataHeight = chartHeight - chartPadding.top - chartPadding.bottom
  const range = weightRange.value.max - weightRange.value.min
  return chartPadding.top + dataHeight - ((weight - weightRange.value.min) / range * dataHeight)
}

// 그래프 경로
const chartPath = computed(() => {
  if (chartData.value.length === 0) return ''
  return chartData.value.map((d, i) => {
    const x = getX(i)
    const y = getY(d.weight)
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
  }).join(' ')
})

// Y축 눈금
const yAxisTicks = computed(() => {
  const range = weightRange.value.max - weightRange.value.min
  const step = Math.ceil(range / 5)
  const ticks = []
  for (let i = 0; i <= 5; i++) {
    const value = weightRange.value.min + step * i
    ticks.push({
      value,
      y: getY(value)
    })
  }
  return ticks.reverse()
})

// 마운트 시 사용자 ID 가져오기
onMounted(() => {
  userId.value = route.params.id
  // 실제로는 API 호출로 사용자 정보 로드
  loadUserProfile(userId.value)
})

const loadUserProfile = (id) => {
  // 더미 데이터 - 실제로는 API 호출
  const users = {
    1: { name: '김철수', nickname: 'chulsoo', email: 'chulsoo@yamyam.com', followers: 8, following: 5 },
    2: { name: '이영희', nickname: 'younghee', email: 'younghee@yamyam.com', followers: 12, following: 8 },
    3: { name: '박지민', nickname: 'jimin', email: 'jimin@yamyam.com', followers: 15, following: 10 },
    4: { name: '최민수', nickname: 'minsu', email: 'minsu@yamyam.com', followers: 6, following: 12 },
    5: { name: '정수현', nickname: 'suhyun', email: 'suhyun@yamyam.com', followers: 20, following: 15 },
    6: { name: '강다은', nickname: 'daeun', email: 'daeun@yamyam.com', followers: 9, following: 7 },
    7: { name: '윤서준', nickname: 'seojun', email: 'seojun@yamyam.com', followers: 11, following: 9 },
    8: { name: '임하늘', nickname: 'haneul', email: 'haneul@yamyam.com', followers: 14, following: 11 }
  }

  if (users[id]) {
    userInfo.value = {
      name: users[id].name,
      nickname: users[id].nickname,
      email: users[id].email
    }
    followStats.value = {
      followers: users[id].followers,
      following: users[id].following
    }
  }

  // 팔로우 상태 확인 (더미 - 실제로는 API에서)
  const myFollowing = [2, 5]
  isFollowing.value = myFollowing.includes(parseInt(id))
}

// 팔로우/언팔로우
const toggleFollow = () => {
  isFollowing.value = !isFollowing.value
  if (isFollowing.value) {
    followStats.value.followers++
    displayToast(`${userInfo.value.name}님을 팔로우했습니다.`)
  } else {
    followStats.value.followers--
    displayToast(`${userInfo.value.name}님을 언팔로우했습니다.`)
  }
}

// 토스트
const displayToast = (message) => {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}
</script>

<template>
  <div class="profile-container">
    <!-- 상단 네비게이션 -->
    <AppHeader active-page="" />

    <!-- 메인 콘텐츠 -->
    <main class="main-content">
      <div class="content-wrapper">
        <div class="page-header">
          <div>
            <button @click="router.back()" class="back-btn">← 돌아가기</button>
            <h1 class="page-title">{{ userInfo.name }}님의 프로필</h1>
          </div>
          <button
            @click="toggleFollow"
            :class="['follow-action-btn', { 'following': isFollowing }]"
          >
            {{ isFollowing ? '언팔로우' : '팔로우' }}
          </button>
        </div>

        <!-- 그리드 레이아웃 -->
        <div class="grid-layout">
          <!-- 사용자 정보 카드 -->
          <div class="card user-info-card">
            <div class="card-header">
              <h2 class="card-title">정보</h2>
            </div>
            <div class="user-info">
              <div class="info-row">
                <span class="info-label">이름</span>
                <span class="info-value">{{ userInfo.name }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">닉네임</span>
                <span class="info-value">{{ userInfo.nickname }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">이메일</span>
                <span class="info-value">{{ userInfo.email }}</span>
              </div>
            </div>

            <!-- 팔로워/팔로잉 섹션 -->
            <div class="follow-section">
              <div class="follow-item" @click="router.push(`/user/${userId}/followers`)">
                <div class="follow-count">{{ followStats.followers }}</div>
                <div class="follow-label">팔로워</div>
              </div>
              <div class="follow-divider"></div>
              <div class="follow-item" @click="router.push(`/user/${userId}/following`)">
                <div class="follow-count">{{ followStats.following }}</div>
                <div class="follow-label">팔로잉</div>
              </div>
            </div>
          </div>

          <!-- 최신 신체 정보 카드 -->
          <div class="card body-info-card">
            <div class="card-header">
              <h2 class="card-title">현재 신체 정보</h2>
            </div>
            <div v-if="latestBodySpec" class="body-info">
              <div class="body-stats">
                <div class="stat-item">
                  <span class="stat-label">키</span>
                  <span class="stat-value">{{ latestBodySpec.height }}<span class="stat-unit">cm</span></span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">체중</span>
                  <span class="stat-value">{{ latestBodySpec.weight }}<span class="stat-unit">kg</span></span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">나이</span>
                  <span class="stat-value">{{ latestBodySpec.age }}<span class="stat-unit">세</span></span>
                </div>
              </div>
              <div class="bmi-section">
                <div class="bmi-header">
                  <span class="bmi-label">BMI</span>
                  <span class="bmi-value" :style="{ color: bmiStatus.color }">{{ bmi }}</span>
                </div>
                <div class="bmi-status" :style="{ backgroundColor: bmiStatus.color }">
                  {{ bmiStatus.text }}
                </div>
              </div>
              <div class="latest-date">
                최근 기록: {{ latestBodySpec.date }}
              </div>
            </div>
            <div v-else class="empty-body-info">
              <p class="empty-text">공개된 신체 정보가 없습니다</p>
            </div>
          </div>

          <!-- 체중 변화 그래프 -->
          <div class="card chart-card">
            <div class="card-header">
              <h2 class="card-title">체중 변화 추이</h2>
            </div>
            <div v-if="chartData.length >= 2" class="chart-container">
              <svg :width="chartWidth" :height="chartHeight" class="chart-svg">
                <!-- 그리드 라인 -->
                <g class="grid-lines">
                  <line
                    v-for="tick in yAxisTicks"
                    :key="tick.value"
                    :x1="chartPadding.left"
                    :y1="tick.y"
                    :x2="chartWidth - chartPadding.right"
                    :y2="tick.y"
                    stroke="#E0E0E0"
                    stroke-dasharray="4"
                  />
                </g>

                <!-- Y축 -->
                <g class="y-axis">
                  <line
                    :x1="chartPadding.left"
                    :y1="chartPadding.top"
                    :x2="chartPadding.left"
                    :y2="chartHeight - chartPadding.bottom"
                    stroke="#666"
                    stroke-width="2"
                  />
                  <text
                    v-for="tick in yAxisTicks"
                    :key="tick.value"
                    :x="chartPadding.left - 10"
                    :y="tick.y + 5"
                    text-anchor="end"
                    class="axis-label"
                  >
                    {{ tick.value }}kg
                  </text>
                </g>

                <!-- X축 -->
                <g class="x-axis">
                  <line
                    :x1="chartPadding.left"
                    :y1="chartHeight - chartPadding.bottom"
                    :x2="chartWidth - chartPadding.right"
                    :y2="chartHeight - chartPadding.bottom"
                    stroke="#666"
                    stroke-width="2"
                  />
                  <text
                    v-for="(d, i) in chartData"
                    :key="i"
                    :x="getX(i)"
                    :y="chartHeight - chartPadding.bottom + 25"
                    text-anchor="middle"
                    class="axis-label"
                  >
                    {{ d.date.substring(5) }}
                  </text>
                </g>

                <!-- 데이터 라인 -->
                <path
                  :d="chartPath"
                  fill="none"
                  stroke="#4CAF50"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />

                <!-- 데이터 포인트 -->
                <g class="data-points">
                  <circle
                    v-for="(d, i) in chartData"
                    :key="i"
                    :cx="getX(i)"
                    :cy="getY(d.weight)"
                    r="6"
                    fill="#4CAF50"
                    stroke="#FFFFFF"
                    stroke-width="2"
                  />
                  <text
                    v-for="(d, i) in chartData"
                    :key="'label-' + i"
                    :x="getX(i)"
                    :y="getY(d.weight) - 15"
                    text-anchor="middle"
                    class="data-label"
                  >
                    {{ d.weight }}kg
                  </text>
                </g>
              </svg>
            </div>
            <div v-else class="empty-chart">
              <p class="empty-text">2개 이상의 기록이 필요합니다</p>
            </div>
          </div>

          <!-- 신체 정보 이력 -->
          <div class="card history-card">
            <div class="card-header">
              <h2 class="card-title">신체 정보 이력</h2>
            </div>
            <div v-if="bodySpecs.length > 0" class="history-list">
              <div
                v-for="spec in [...bodySpecs].sort((a, b) => new Date(b.date) - new Date(a.date))"
                :key="spec.id"
                class="history-item"
              >
                <div class="history-date">{{ spec.date }}</div>
                <div class="history-stats">
                  <span class="history-stat">키: {{ spec.height }}cm</span>
                  <span class="history-stat">체중: {{ spec.weight }}kg</span>
                  <span class="history-stat">나이: {{ spec.age }}세</span>
                  <span class="history-stat">성별: {{ spec.gender }}</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-history">
              <p class="empty-text">공개된 신체 정보 기록이 없습니다</p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 토스트 메시지 -->
    <div v-if="showToast" class="toast-message">
      <div class="toast-icon">✓</div>
      <span class="toast-text">{{ toastMessage }}</span>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  min-height: 100vh;
  background-color: #F5F7FA;
}

/* 메인 콘텐츠 */
.main-content {
  padding: 40px;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.back-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  color: #666666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 12px;
}

.back-btn:hover {
  background: #F5F7FA;
  border-color: #999999;
  color: #333333;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #333333;
}

.follow-action-btn {
  padding: 12px 32px;
  background: #4CAF50;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.follow-action-btn:hover {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.follow-action-btn.following {
  background: #FFFFFF;
  color: #666666;
  border: 2px solid #E0E0E0;
}

.follow-action-btn.following:hover {
  background: #F5F7FA;
  border-color: #999999;
  color: #333333;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 그리드 레이아웃 */
.grid-layout {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

/* 카드 */
.card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: #333333;
}

/* 사용자 정보 */
.user-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #F0F0F0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 15px;
  font-weight: 600;
  color: #666666;
}

.info-value {
  font-size: 15px;
  color: #333333;
}

/* 팔로워/팔로잉 섹션 */
.follow-section {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 20px;
  background: #F8F9FA;
  border-radius: 8px;
  margin-top: 8px;
}

.follow-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 8px 16px;
  border-radius: 8px;
}

.follow-item:hover {
  background: #E8F5E9;
  transform: translateY(-2px);
}

.follow-count {
  font-size: 28px;
  font-weight: 700;
  color: #4CAF50;
}

.follow-label {
  font-size: 14px;
  font-weight: 500;
  color: #666666;
}

.follow-divider {
  width: 1px;
  height: 40px;
  background: #E0E0E0;
}

/* 신체 정보 */
.body-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.body-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #F8F9FA;
  border-radius: 8px;
}

.stat-label {
  display: block;
  font-size: 13px;
  color: #888888;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #333333;
}

.stat-unit {
  font-size: 16px;
  font-weight: 500;
  color: #888888;
  margin-left: 4px;
}

.bmi-section {
  padding: 16px;
  background: #F8F9FA;
  border-radius: 8px;
}

.bmi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.bmi-label {
  font-size: 15px;
  font-weight: 600;
  color: #666666;
}

.bmi-value {
  font-size: 32px;
  font-weight: 700;
}

.bmi-status {
  padding: 8px 16px;
  border-radius: 20px;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}

.latest-date {
  font-size: 13px;
  color: #888888;
  text-align: center;
}

.empty-body-info {
  text-align: center;
  padding: 40px 20px;
}

.empty-text {
  font-size: 15px;
  color: #888888;
  margin-bottom: 16px;
}

/* 그래프 */
.chart-card {
  grid-column: span 2;
}

.chart-container {
  overflow-x: auto;
  padding: 20px 0;
}

.chart-svg {
  display: block;
  margin: 0 auto;
}

.axis-label {
  font-size: 12px;
  fill: #666666;
}

.data-label {
  font-size: 13px;
  font-weight: 600;
  fill: #333333;
}

.empty-chart {
  text-align: center;
  padding: 60px 20px;
}

/* 이력 */
.history-card {
  grid-column: span 2;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #F8F9FA;
  border-radius: 8px;
  transition: background 0.3s ease;
}

.history-item:hover {
  background: #E8F5E9;
}

.history-date {
  font-size: 14px;
  font-weight: 700;
  color: #4CAF50;
  min-width: 100px;
}

.history-stats {
  flex: 1;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.history-stat {
  font-size: 14px;
  color: #666666;
}

.empty-history {
  text-align: center;
  padding: 40px 20px;
}

/* 모달 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #FFFFFF;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-content.small-modal {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  border-bottom: 1px solid #E0E0E0;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #333333;
}

.modal-close {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: #666666;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: #F8F9FA;
  color: #333333;
}

.modal-body {
  padding: 28px;
}

.modal-message {
  font-size: 16px;
  color: #333333;
  text-align: center;
  margin: 8px 0;
}

.modal-footer {
  padding: 24px 28px;
  border-top: 1px solid #E0E0E0;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.modal-btn {
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

.cancel-btn-modal {
  background: #F5F7FA;
  border: 1px solid #E0E0E0;
  color: #666666;
}

.cancel-btn-modal:hover {
  background: #E8EAF0;
  border-color: #BDBDBD;
  color: #333333;
}

/* 토스트 */
.toast-message {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1100;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateX(-50%) translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

.toast-icon {
  width: 24px;
  height: 24px;
  background: #4CAF50;
  color: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
}

.toast-text {
  font-size: 15px;
  color: #333333;
  font-weight: 600;
}

/* 반응형 */
@media (max-width: 968px) {
  .grid-layout {
    grid-template-columns: 1fr;
  }

  .chart-card,
  .history-card {
    grid-column: span 1;
  }

  .body-stats {
    grid-template-columns: repeat(3, 1fr);
  }

  .nav-menu {
    display: none;
  }
}
</style>
