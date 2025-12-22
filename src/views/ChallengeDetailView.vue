<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import api from '@/util/axios'

const route = useRoute()
const router = useRouter()
const challengeId = route.params.id

const challenge = ref(null)
const successDates = ref([])
const isParticipating = ref(false) // 참여 여부 상태
const today = new Date().toISOString().split('T')[0]

// 1. 챌린지 상세 정보 불러오기
const fetchDetail = async () => {
  try {
    const res = await api.get(`/api/challenges/${challengeId}/detail`)
    challenge.value = res.data
    successDates.value = res.data.successDates
  } catch (e) {
    console.error(e)
    alert('정보를 불러오지 못했습니다.')
  }
}

// 2. 참여 여부 확인 (내 챌린지 목록 조회)
const checkParticipation = async () => {
  try {
    const res = await api.get('/api/challenges/my')
    // 내 챌린지 목록에 현재 ID가 있는지 확인
    const myChallengeIds = res.data.map(c => c.id)
    isParticipating.value = myChallengeIds.includes(Number(challengeId))
  } catch (e) {
    console.error('참여 상태 확인 실패', e)
  }
}

// 3. 체크 토글 (참여자만 가능)
const toggleCheck = async (targetDate) => {
  if (!isParticipating.value) {
    alert('챌린지에 참여해야 인증할 수 있습니다!')
    return
  }
  
  // 미래 날짜 클릭 방지
  if (targetDate > today) {
    alert('미래의 날짜는 아직 기록할 수 없습니다.')
    return
  }

  try {
    // 백엔드로 날짜 전송
    await api.post(`/api/challenges/${challengeId}/check`, { date: targetDate })
    await fetchDetail() 
  } catch (e) {
    console.error(e)
    alert('처리 중 오류가 발생했습니다.')
  }
}

// 4. 챌린지 참여하기
const joinChallenge = async () => {
  if(!confirm('이 챌린지에 참여하시겠습니까?')) return

  try {
    await api.post(`/api/challenges/${challenge.value.id}/join`)
    alert('참여가 완료되었습니다! 오늘부터 시작해보세요 🔥')
    await checkParticipation() // 상태 갱신
    await fetchDetail() // 데이터 갱신
  } catch (e) {
    console.error(e)
    alert('참여 실패: ' + (e.response?.data?.message || '오류가 발생했습니다.'))
  }
}

// 5. 챌린지 포기하기
const quitChallenge = async () => {
  if(!confirm('정말 포기하시겠습니까? 기록이 유지되고 다시 도전할 수 있습니다.')) return

  try {
    await api.delete(`/api/challenges/${challenge.value.id}/quit`)
    alert('챌린지를 포기했습니다.')
    await checkParticipation() // 상태 갱신
    await fetchDetail() // 데이터 갱신
  } catch (e) {
    console.error(e)
    alert('포기 실패')
  }
}

// 6. 목록으로 돌아가기
const goBack = () => {
  router.push('/challenge') // 챌린지 목록 페이지 경로
}

// 날짜 목록 계산
const calendarDays = computed(() => {
  if (!challenge.value) return []
  
  const days = []
  let current = new Date(challenge.value.startDate)
  const end = new Date(challenge.value.endDate)
  
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    days.push({
      date: dateStr,
      isSuccess: successDates.value.includes(dateStr),
      isToday: dateStr === today,
      isFuture: dateStr > today,
      isPast: dateStr < today // 과거 여부 추가
    })
    current.setDate(current.getDate() + 1)
  }
  return days
})

onMounted(async () => {
  await fetchDetail()
  await checkParticipation()
})
</script>

<template>
  <div class="detail-container">
    <AppHeader active-page="challenge" />
    
    <main class="main-content" v-if="challenge">
      <div class="content-wrapper">
        
        <div class="header-section">
          <button @click="goBack" class="back-btn">
            <span class="arrow">←</span> 목록으로
          </button>
          
          <div class="title-group">
            <h1 class="page-title">{{ challenge.title }}</h1>
            <span class="date-range">{{ challenge.startDate.split('T')[0] }} ~ {{ challenge.endDate.split('T')[0] }}</span>
          </div>

          <div class="action-btn-group">
            <button v-if="!isParticipating" @click="joinChallenge" class="btn-action btn-join">
              참여하기
            </button>
            <button v-else @click="quitChallenge" class="btn-action btn-quit">
              포기하기
            </button>
          </div>
        </div>

        <div class="card desc-card">
          <h3>챌린지 소개</h3>
          <p class="desc-text">{{ challenge.description }}</p>
        </div>
        
        <div class="status-section" :class="{ 'disabled-section': !isParticipating }">
          
          <div class="card progress-card">
            <h2>나의 달성률</h2>
            <div class="progress-bar-lg">
               <div class="fill" :style="{ width: challenge.progress + '%' }"></div>
            </div>
            <p class="percent-text">{{ challenge.progress }}%</p>
          </div>

          <div class="card calendar-card">
            <h2>일별 기록</h2>
            <div class="calendar-grid">
              <div 
                v-for="day in calendarDays" 
                :key="day.date"
                class="day-item"
                :class="{ 
                  'success': day.isSuccess, 
                  'today': day.isToday,
                  'future': day.isFuture,
                  'clickable': isParticipating && !day.isFuture
                }"
                @click="(!day.isFuture && isParticipating) ? toggleCheck(day.date) : null"
              >
                <div class="day-date">{{ day.date.substring(5) }}</div>
                <div class="day-status">
                  <span v-if="day.isSuccess">✅ 성공</span>
                  <span v-else-if="day.isFuture">🔒 예정</span>
                  <span v-else-if="day.isToday && !day.isSuccess">👉 오늘</span>
                  <span v-else>❌ 실패</span>
                </div>
              </div>
            </div>
          </div>

        </div> 
      </div>
    </main>
  </div>
</template>

<style scoped>
.detail-container { min-height: 100vh; background: #F5F7FA; }
.main-content { padding: 40px; }
.content-wrapper { max-width: 900px; margin: 0 auto; } /* 버튼 공간 위해 너비 살짝 늘림 */

/* --- 헤더 영역 (좌:목록 / 중:제목 / 우:버튼) --- */
.header-section { 
  position: relative; /* 기준점 */
  display: flex; 
  justify-content: center; /* 타이틀 중앙 */
  align-items: center; 
  margin-bottom: 32px;
  min-height: 60px;
}

/* 1. 목록 버튼 (왼쪽 고정) */
.back-btn {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  background: none; border: none; font-size: 15px; color: #666; cursor: pointer; font-weight: 600;
  display: flex; align-items: center; gap: 6px; padding: 8px 0;
  transition: color 0.2s;
}
.back-btn:hover { color: #333; }

/* 2. 타이틀 그룹 (중앙 정렬) */
.title-group { 
  display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; 
}
.page-title { font-size: 28px; font-weight: 800; color: #333; margin: 0; line-height: 1.2; }
.date-range { font-size: 14px; color: #888; font-weight: 500; background-color: #F1F3F5; padding: 4px 12px; border-radius: 20px; }

/* 3. 액션 버튼 그룹 (오른쪽 고정) */
.action-btn-group {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

.btn-action {
  padding: 10px 24px; border-radius: 8px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; border: none;
  height: 44px;
}
.btn-join { background: #4CAF50; color: white; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3); }
.btn-join:hover { background: #43A047; transform: translateY(-2px); }
.btn-quit { background: #FFEBEE; color: #D32F2F; border: 1px solid #FFCDD2; }
.btn-quit:hover { background: #FFCDD2; transform: translateY(-2px); }

/* --- 카드 공통 --- */
.card { background: white; padding: 30px; border-radius: 16px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
.card h2, .card h3 { font-size: 18px; margin-bottom: 16px; font-weight: 700; color: #333; }

/* 설명 카드 (단순화됨) */
.desc-card { border: 1px solid #E0E0E0; }
.desc-text { font-size: 16px; line-height: 1.6; color: #444; margin: 0; white-space: pre-line; }

/* --- 진행률 & 달력 --- */
.status-section { transition: opacity 0.3s; }
.disabled-section { opacity: 0.6; pointer-events: none; filter: grayscale(30%); }

.progress-bar-lg { height: 24px; background: #F1F3F5; border-radius: 12px; overflow: hidden; margin-bottom: 8px; }
.fill { height: 100%; background: linear-gradient(90deg, #4CAF50, #81C784); transition: width 0.5s ease-out; }
.percent-text { text-align: right; font-weight: 800; color: #2E7D32; font-size: 20px; }

.calendar-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; }
.day-item { 
  background: #f9f9f9; border: 1px solid #eee; border-radius: 12px; padding: 14px; 
  text-align: center; cursor: default; transition: all 0.2s; display: flex; flex-direction: column; gap: 4px;
}
.day-item.clickable { cursor: pointer; }
.day-item.clickable:hover { background: #E8F5E9; transform: translateY(-2px); border-color: #A5D6A7; }
.day-item.today { border: 2px solid #4CAF50; background: #fff; }
.day-item.success { background: #E8F5E9; border-color: #A5D6A7; color: #2E7D32; }
.day-item.future { opacity: 0.5; background: #eee; color: #aaa; cursor: not-allowed; }
.day-date { font-size: 12px; color: #888; }
.day-status { font-size: 13px; font-weight: 600; }

/* --- 반응형 (모바일) --- */
@media (max-width: 768px) {
  .header-section {
    flex-direction: column; /* 세로로 쌓기 */
    gap: 16px;
    margin-bottom: 24px;
  }
  
  /* 절대 위치 해제하고 순서대로 배치 */
  .back-btn, .action-btn-group {
    position: static;
    transform: none;
  }
  
  .back-btn { align-self: flex-start; } /* 왼쪽 정렬 */
  .action-btn-group { width: 100%; }
  .btn-action { width: 100%; } /* 버튼 꽉 차게 */
}
</style>