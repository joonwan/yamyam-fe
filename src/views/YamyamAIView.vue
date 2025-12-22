<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import api from '@/util/axios'
import { dailyDietApi, dietPlanApi } from '@/api/diet.js'
import { formatDate } from '@/utils/date.js'

// ==========================================
// 1. 상태 변수
// ==========================================
const messages = ref([
  { role: 'assistant', content: '안녕하세요! 저는 영양 전문가 쩝쩝교수입니다. 무엇을 도와드릴까요? 😊' }
])
const userInput = ref('')
const isLoading = ref(false)
const chatContainer = ref(null)

// 사용자 데이터 (DB에서 가져옴)
const myBodySpec = ref(null)
const myTodayDiet = ref(null)
const myChallenges = ref([])

// 첨부 상태 (Toggle)
const attachments = ref({
  body: false,      // 신체 정보 첨부 여부
  diet: false,      // 식단 정보 첨부 여부
  challenge: []     // 선택된 챌린지 ID 리스트
})

const showSidebar = ref(true) // PC에서는 기본 열림

// ==========================================
// 2. 데이터 조회 API
// ==========================================
const fetchAllData = async () => {
  try {
    // 1. 신체 정보 (최신 1개)
    const bodyRes = await api.get('/api/body-specs')
    if (bodyRes.data.length > 0) {
      // 날짜순 정렬 후 최신 것 가져오기
      myBodySpec.value = bodyRes.data.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    }

    // 2. 오늘의 식단
    const planRes = await dietPlanApi.getPrimary()
    if (planRes.data?.dietPlanId) {
      const dailyRes = await dailyDietApi.getByDate(planRes.data.dietPlanId, formatDate(new Date()))
      if (dailyRes.data?.dailyDietId) {
        myTodayDiet.value = dailyRes.data // 전체 식단 정보
      }
    }

    // 3. 챌린지 (참여 중인 것만)
    const challengeRes = await api.get('/api/challenges/my')
    myChallenges.value = challengeRes.data.filter(c => c.challengeStatus === 'PROGRESS')

  } catch (e) {
    console.error('데이터 로드 실패', e)
  }
}

// ==========================================
// 3. 로직: 컨텍스트 생성 & 추천 질문
// ==========================================

// 선택된 정보들을 문자열로 변환 (AI에게 보낼 용도)
const contextString = computed(() => {
  let context = []

  if (attachments.value.body && myBodySpec.value) {
    context.push(`[신체 정보]\n키: ${myBodySpec.value.height}cm, 체중: ${myBodySpec.value.weight}kg, 나이: ${myBodySpec.value.age}세, 성별: ${myBodySpec.value.gender}`)
  }

  if (attachments.value.diet && myTodayDiet.value) {
    // 식단 정보를 간략화
    const meals = ['breakfast', 'lunch', 'dinner', 'snack']
    let dietStr = '[오늘 식단]\n'
    let totalCal = 0
    meals.forEach(type => {
      const meal = myTodayDiet.value[type]
      if (meal && meal.mealFoods) {
        const foodNames = meal.mealFoods.map(f => f.foodName).join(', ')
        const cals = meal.mealFoods.reduce((sum, f) => sum + (f.quantity/100 * f.energyPer100), 0)
        totalCal += cals
        dietStr += `- ${type}: ${foodNames} (${Math.round(cals)}kcal)\n`
      }
    })
    dietStr += `총 섭취 칼로리: ${Math.round(totalCal)}kcal`
    context.push(dietStr)
  }

  if (attachments.value.challenge.length > 0) {
    let chStr = '[참여 중인 챌린지]\n'
    attachments.value.challenge.forEach(id => {
      const target = myChallenges.value.find(c => c.id === id)
      if (target) {
        chStr += `- ${target.title} (달성률: ${target.progress}%)\n`
      }
    })
    context.push(chStr)
  }

  return context.join('\n\n')
})

// ★ 동적 추천 질문 생성 (핵심 기능)
const recommendedQuestions = computed(() => {
  const list = []
  
  // 기본 질문
  if (!attachments.value.body && !attachments.value.diet && attachments.value.challenge.length === 0) {
    return ['다이어트 꿀팁 알려줘', '저녁 메뉴 추천해줘', '식욕 참는 법 알려줘']
  }

  // 1. 신체 정보 기반
  if (attachments.value.body) {
    list.push('내 BMI 지수와 비만도 분석해줘')
    list.push('내 키와 몸무게에 맞는 하루 권장 칼로리는?')
  }

  // 2. 식단 정보 기반
  if (attachments.value.diet) {
    list.push('오늘 먹은 식단 영양소 평가해줘')
    list.push('오늘 칼로리 기준으로 저녁 메뉴 추천해줘')
  }

  // 3. 챌린지 기반
  if (attachments.value.challenge.length > 0) {
    list.push('선택한 챌린지를 성공하기 위한 팁 알려줘')
    list.push('챌린지 달성률을 높이려면 어떻게 해야 할까?')
  }

  // 4. 복합 질문 (신체 + 식단)
  if (attachments.value.body && attachments.value.diet) {
    list.push('내 목표 체중을 위해 오늘 식단에서 뭘 빼면 좋을까?')
  }

  // 랜덤으로 섞거나 최대 4개만 노출
  return list.slice(0, 4)
})

// ==========================================
// 4. 채팅 전송
// ==========================================

const sendMessage = async (text = null) => {
  const content = text || userInput.value
  if (!content.trim() || isLoading.value) return

  // 1. 사용자 메시지 UI에 추가
  messages.value.push({ role: 'user', content: content })
  userInput.value = ''
  scrollToBottom()

  // 2. 로딩 시작
  isLoading.value = true
  
  try {
    // 3. 백엔드로 전송 (Context Injection)
    // 실제로는 백엔드의 /api/ai/chat 엔드포인트가 userId와 message를 받도록 되어있다고 가정
    // 여기서는 프롬프트에 컨텍스트를 합쳐서 보냅니다.
    
    // 만약 백엔드가 body, diet 등의 데이터를 직접 조회하는 구조라면 userId만 보내면 되지만,
    // 현재 UI에서 '선택한 정보'만 보내길 원하므로 텍스트에 합쳐서 보냅니다.
    const fullPrompt = `
      ${contextString.value ? `[참고 정보]\n${contextString.value}\n----------------\n` : ''}
      ${content}
    `

    // 백엔드 호출 (Controller가 userQuestion을 받아서 처리)
    // 기존에 만드신 Controller 스펙에 맞춰 수정하세요.
    const res = await api.post('/api/ai/chat', {
        userId: 1, // 실제로는 토큰이나 세션에서 처리
        message: fullPrompt // 질문에 정보를 섞어서 보냄
        // 혹은 question: content, context: contextString.value 로 나눠서 보낼 수도 있음
    })

    // 4. 응답 처리
    const answer = res.data // 문자열 응답이라고 가정
    messages.value.push({ role: 'assistant', content: answer })

  } catch (e) {
    messages.value.push({ role: 'assistant', content: '죄송해요, 잠시 문제가 발생했어요 ㅠㅠ' })
    console.error(e)
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

// 추천 질문 클릭 시
const applyPrompt = (question) => {
  sendMessage(question)
}

// 챌린지 토글 헬퍼
const toggleChallenge = (id) => {
  const idx = attachments.value.challenge.indexOf(id)
  if (idx >= 0) attachments.value.challenge.splice(idx, 1)
  else attachments.value.challenge.push(id)
}

onMounted(() => {
  fetchAllData()
})
</script>

<template>
  <div class="ai-container">
    <AppHeader active-page="ai" />

    <div class="ai-layout">
      <main class="chat-section">
        <div class="chat-header">
          <h2>🎓 쩝쩝교수</h2>
          <button class="sidebar-toggle" @click="showSidebar = !showSidebar">
            {{ showSidebar ? '데이터 숨기기' : '데이터 첨부하기' }}
          </button>
        </div>

        <div class="chat-window" ref="chatContainer">
          <div v-for="(msg, idx) in messages" :key="idx" 
               class="message-row" :class="msg.role">
            <div class="avatar" v-if="msg.role === 'assistant'">🤖</div>
            <div class="bubble">
              <span style="white-space: pre-wrap;">{{ msg.content }}</span>
            </div>
          </div>
          <div v-if="isLoading" class="message-row assistant">
            <div class="avatar">🤖</div>
            <div class="bubble loading">
              <span>.</span><span>.</span><span>.</span>
            </div>
          </div>
        </div>

        <div class="suggestion-area">
          <div class="suggestion-scroll">
            <button v-for="(q, i) in recommendedQuestions" :key="i"
                    class="suggestion-chip"
                    @click="applyPrompt(q)">
              ✨ {{ q }}
            </button>
          </div>
        </div>

        <div class="input-area">
          <div class="attachment-preview" v-if="contextString">
            <span class="preview-badge" v-if="attachments.body">신체정보 ON</span>
            <span class="preview-badge" v-if="attachments.diet">식단 ON</span>
            <span class="preview-badge" v-if="attachments.challenge.length > 0">챌린지 {{ attachments.challenge.length }}개 ON</span>
          </div>
          <div class="input-wrapper">
            <textarea 
              v-model="userInput" 
              @keydown.enter.prevent="sendMessage()"
              placeholder="무엇이든 물어보세요..."
            ></textarea>
            <button @click="sendMessage()" :disabled="!userInput.trim() || isLoading" class="send-btn">
              ➤
            </button>
          </div>
        </div>
      </main>

      <transition name="slide-right">
        <aside v-if="showSidebar" class="data-sidebar">
          <div class="sidebar-header">
            <h3>내 정보 첨부하기</h3>
            <p class="sidebar-desc">선택한 정보가 AI에게 전달됩니다.</p>
          </div>

          <div class="sidebar-content">
            
            <div class="data-card" :class="{ active: attachments.body }" @click="attachments.body = !attachments.body">
              <div class="card-top">
                <span class="card-icon">💪</span>
                <h4>신체 정보</h4>
                <div class="checkbox" :class="{ checked: attachments.body }"></div>
              </div>
              <div v-if="myBodySpec" class="card-detail">
                <p>{{ myBodySpec.height }}cm / {{ myBodySpec.weight }}kg</p>
                <p>{{ myBodySpec.age }}세 / {{ myBodySpec.gender }}</p>
              </div>
              <div v-else class="card-detail empty">기록 없음</div>
            </div>

            <div class="data-card" :class="{ active: attachments.diet }" @click="attachments.diet = !attachments.diet">
              <div class="card-top">
                <span class="card-icon">🥗</span>
                <h4>오늘의 식단</h4>
                <div class="checkbox" :class="{ checked: attachments.diet }"></div>
              </div>
              <div v-if="myTodayDiet" class="card-detail">
                <p>총 섭취: 계산중...</p> <p class="sub-text">클릭해서 상세 내용 첨부</p>
              </div>
              <div v-else class="card-detail empty">오늘 기록 없음</div>
            </div>

            <div class="challenge-group">
              <h4>진행 중인 챌린지</h4>
              <div v-if="myChallenges.length > 0" class="challenge-list">
                <div v-for="c in myChallenges" :key="c.id" 
                     class="challenge-item"
                     :class="{ active: attachments.challenge.includes(c.id) }"
                     @click="toggleChallenge(c.id)">
                  <span class="ch-title">{{ c.title }}</span>
                  <div class="checkbox small" :class="{ checked: attachments.challenge.includes(c.id) }"></div>
                </div>
              </div>
              <div v-else class="empty-text">진행 중인 챌린지가 없습니다.</div>
            </div>

          </div>
        </aside>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.ai-container { height: 100vh; display: flex; flex-direction: column; background: #F5F7FA; overflow: hidden; }

/* 레이아웃: 채팅(Flex 1) + 사이드바(300px) */
.ai-layout { display: flex; flex: 1; overflow: hidden; position: relative; }

/* --- 1. 채팅 섹션 --- */
.chat-section { flex: 1; display: flex; flex-direction: column; position: relative; }

.chat-header { 
  padding: 16px 24px; background: white; border-bottom: 1px solid #eee; 
  display: flex; justify-content: space-between; align-items: center; 
}
.chat-header h2 { font-size: 18px; font-weight: 700; margin: 0; color: #333; }
.sidebar-toggle { padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 20px; cursor: pointer; font-size: 13px; }

.chat-window { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; background: #f0f2f5; }

.message-row { display: flex; gap: 10px; max-width: 80%; }
.message-row.user { align-self: flex-end; flex-direction: row-reverse; }
.message-row.assistant { align-self: flex-start; }

.avatar { width: 36px; height: 36px; background: #E8F5E9; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 20px; }

.bubble { padding: 12px 16px; border-radius: 16px; font-size: 15px; line-height: 1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
.assistant .bubble { background: white; border-top-left-radius: 4px; color: #333; }
.user .bubble { background: #4CAF50; color: white; border-top-right-radius: 4px; }

/* 로딩 애니메이션 */
.bubble.loading span { animation: blink 1.4s infinite both; font-size: 20px; line-height: 10px; }
.bubble.loading span:nth-child(2) { animation-delay: 0.2s; }
.bubble.loading span:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink { 0% { opacity: 0.2; } 20% { opacity: 1; } 100% { opacity: 0.2; } }

/* 추천 질문 영역 */
.suggestion-area { padding: 10px 20px 0; background: white; border-top: 1px solid #f0f0f0; }
.suggestion-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 10px; }
.suggestion-scroll::-webkit-scrollbar { height: 4px; }
.suggestion-chip { 
  flex-shrink: 0; padding: 8px 14px; background: #fff; border: 1px solid #4CAF50; 
  color: #4CAF50; border-radius: 20px; font-size: 13px; cursor: pointer; transition: all 0.2s; 
}
.suggestion-chip:hover { background: #E8F5E9; }

/* 입력 영역 */
.input-area { padding: 10px 20px 20px; background: white; }
.attachment-preview { display: flex; gap: 6px; margin-bottom: 8px; font-size: 11px; }
.preview-badge { background: #E3F2FD; color: #1976D2; padding: 2px 8px; border-radius: 4px; font-weight: 600; }

.input-wrapper { display: flex; gap: 10px; position: relative; }
textarea { 
  flex: 1; height: 50px; padding: 12px; border: 1px solid #ddd; border-radius: 12px; 
  resize: none; font-size: 15px; outline: none; transition: border 0.2s;
}
textarea:focus { border-color: #4CAF50; }
.send-btn { 
  width: 50px; background: #4CAF50; color: white; border: none; border-radius: 12px; 
  cursor: pointer; font-size: 18px; transition: background 0.2s; 
}
.send-btn:disabled { background: #ccc; cursor: not-allowed; }

/* --- 2. 사이드바 --- */
.data-sidebar { 
  width: 320px; background: white; border-left: 1px solid #eee; display: flex; flex-direction: column; 
  z-index: 10; box-shadow: -2px 0 10px rgba(0,0,0,0.05);
}
.sidebar-header { padding: 20px; border-bottom: 1px solid #eee; }
.sidebar-header h3 { margin: 0 0 4px; font-size: 18px; }
.sidebar-desc { margin: 0; color: #888; font-size: 13px; }

.sidebar-content { padding: 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 16px; }

/* 데이터 카드 */
.data-card { 
  border: 1px solid #eee; border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s;
}
.data-card:hover { border-color: #A5D6A7; background: #F9FFF9; }
.data-card.active { border-color: #4CAF50; background: #E8F5E9; }

.card-top { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.card-icon { font-size: 20px; }
.card-top h4 { margin: 0; flex: 1; font-size: 15px; }

.checkbox { width: 20px; height: 20px; border: 2px solid #ddd; border-radius: 50%; position: relative; transition: all 0.2s; }
.checkbox.checked { background: #4CAF50; border-color: #4CAF50; }
.checkbox.checked::after { content: '✔'; color: white; font-size: 12px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }

.card-detail { font-size: 13px; color: #555; padding-left: 30px; }
.card-detail.empty { color: #999; font-style: italic; }
.sub-text { font-size: 11px; color: #999; margin-top: 4px; }

/* 챌린지 그룹 */
.challenge-group h4 { margin: 10px 0; font-size: 14px; color: #666; }
.challenge-list { display: flex; flex-direction: column; gap: 8px; }
.challenge-item { 
  display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; 
  border: 1px solid #eee; border-radius: 8px; cursor: pointer; transition: all 0.2s;
}
.challenge-item:hover { background: #f9f9f9; }
.challenge-item.active { border-color: #4CAF50; background: #E8F5E9; }
.ch-title { font-size: 13px; }
.checkbox.small { width: 18px; height: 18px; font-size: 10px; }

.empty-text { font-size: 13px; color: #999; text-align: center; padding: 10px; }

/* 트랜지션 */
.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.3s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }

/* 반응형 */
@media (max-width: 768px) {
  .data-sidebar { position: absolute; right: 0; top: 0; bottom: 0; width: 80%; }
}
</style>