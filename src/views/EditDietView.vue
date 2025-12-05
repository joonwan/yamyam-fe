<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const route = useRoute()

// 폼 데이터
const mealType = ref('아침')
const foods = ref([
  { name: '', amount: 100, unit: 'g', caloriePerG: 0, caloriePerMl: 0 }
])

// 토스트 메시지
const showToast = ref(false)
const toastMessage = ref('')

// 자동완성 관련
const searchResults = ref([])
const activeFoodIndex = ref(null)
const showAutocomplete = ref(false)
let searchTimeout = null
let isSelecting = false

// 네트워크 오류
const networkError = ref(false)
const errorMessage = ref('')

// 단위 옵션
const unitOptions = ['g', 'ml']

// 더미 데이터 - 실제로는 API에서 가져와야 함
const dailyDiet = {
  '아침': [
    { name: '현미밥', amount: 210, unit: 'g', caloriePerG: 143, caloriePerMl: 0 },
    { name: '계란후라이', amount: 50, unit: 'g', caloriePerG: 180, caloriePerMl: 0 },
  ],
  '점심': [
    { name: '샐러드', amount: 150, unit: 'g', caloriePerG: 100, caloriePerMl: 0 },
    { name: '닭가슴살', amount: 100, unit: 'g', caloriePerG: 165, caloriePerMl: 0 },
  ],
  '저녁': [],
  '간식': []
}

// 외부 클릭 감지
const handleClickOutside = (event) => {
  // autocomplete-wrapper 밖을 클릭하면 자동완성 닫기
  const target = event.target
  if (!target.closest('.autocomplete-wrapper')) {
    showAutocomplete.value = false
    activeFoodIndex.value = null
  }
}

// query parameter로 받은 mealType의 기존 데이터를 로드
onMounted(() => {
  if (route.query.mealType) {
    mealType.value = route.query.mealType

    // 해당 식사의 기존 데이터가 있으면 로드
    const existingFoods = dailyDiet[mealType.value]
    if (existingFoods && existingFoods.length > 0) {
      foods.value = existingFoods.map(food => ({
        name: food.name,
        amount: food.amount,
        unit: food.unit,
        caloriePerG: food.caloriePerG,
        caloriePerMl: food.caloriePerMl
      }))
    }
  }
  // 외부 클릭 이벤트 리스너 등록
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  // 외부 클릭 이벤트 리스너 해제
  document.removeEventListener('click', handleClickOutside)
})

const addFood = () => {
  foods.value.push({ name: '', amount: 100, unit: 'g', caloriePerG: 0, caloriePerMl: 0 })
}

const removeFood = (index) => {
  foods.value.splice(index, 1)
  if (activeFoodIndex.value === index) {
    showAutocomplete.value = false
    activeFoodIndex.value = null
  }
}

// 칼로리 계산 함수
const calculateCalorie = (food) => {
  if (!food.amount || food.amount <= 0) return 0

  if (food.unit === 'g' && food.caloriePerG) {
    return Number(((food.amount / 100) * food.caloriePerG).toFixed(2))
  } else if (food.unit === 'ml' && food.caloriePerMl) {
    return Number(((food.amount / 100) * food.caloriePerMl).toFixed(2))
  }

  return 0
}

// 총 칼로리 계산
const totalCalories = computed(() => {
  const total = foods.value.reduce((sum, food) => {
    return sum + calculateCalorie(food)
  }, 0)
  return Number(total.toFixed(2))
})

// 음식 검색 API 호출
const searchFood = async (query, index) => {
  if (!query || query.trim() === '') {
    searchResults.value = []
    showAutocomplete.value = false
    networkError.value = false
    return
  }

  try {
    const response = await axios.get(`http://localhost:8080/api/foods/search`, {
      params: { name: query }
    })
    searchResults.value = response.data
    activeFoodIndex.value = index
    showAutocomplete.value = searchResults.value.length > 0
    networkError.value = false
  } catch (error) {
    console.error('음식 검색 실패:', error)
    searchResults.value = []
    showAutocomplete.value = false
    networkError.value = true
    errorMessage.value = '네트워크 오류입니다'

    // 3초 후 에러 메시지 자동 숨김
    setTimeout(() => {
      networkError.value = false
    }, 3000)
  }
}

// 음식명 입력 핸들러 (debounce 적용)
const handleFoodNameInput = (event, index) => {
  // 음식 선택 중이면 무시
  if (isSelecting) return

  const query = event.target.value

  // 이전 타이머 취소
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  // 300ms 후에 검색 실행
  searchTimeout = setTimeout(() => {
    searchFood(query, index)
  }, 300)
}

// 자동완성에서 음식 선택
const selectFood = (food, index) => {
  isSelecting = true

  foods.value[index].name = food.name
  foods.value[index].caloriePerG = food.caloriePerG || 0
  foods.value[index].caloriePerMl = food.caloriePerMl || 0

  // 사용 가능한 단위로 자동 설정
  if (food.caloriePerG) {
    foods.value[index].unit = 'g'
  } else if (food.caloriePerMl) {
    foods.value[index].unit = 'ml'
  }

  showAutocomplete.value = false
  searchResults.value = []
  activeFoodIndex.value = null

  // 100ms 후 플래그 해제
  setTimeout(() => {
    isSelecting = false
  }, 100)
}

// input focus 핸들러
const handleFoodNameFocus = (index) => {
  activeFoodIndex.value = index
  if (foods.value[index].name && searchResults.value.length > 0) {
    showAutocomplete.value = true
  }
}

const displayToast = (message) => {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

const handleSubmit = () => {
  displayToast('식단이 수정되었습니다!')
  setTimeout(() => {
    router.push('/diet')
  }, 500)
}

const handleCancel = () => {
  router.back()
}
</script>

<template>
  <div class="add-diet-container">
    <!-- 상단 네비게이션 -->
    <header class="header">
      <div class="header-content">
        <div class="logo" @click="router.push('/main')">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" stroke="#4CAF50" stroke-width="2"/>
            <path d="M13 20 L18 25 L28 14" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="logo-text">냠냠 코치</span>
        </div>

        <nav class="nav-menu">
          <router-link to="/main" class="nav-item">대시보드</router-link>
          <router-link to="/diet" class="nav-item active">식단 관리</router-link>
          <router-link to="/board" class="nav-item">게시판</router-link>
          <router-link to="/challenge" class="nav-item">챌린지</router-link>
          <router-link to="/friends" class="nav-item">친구 검색</router-link>
          <router-link to="/mypage" class="nav-item">마이페이지</router-link>
        </nav>

        <div class="user-menu">
          <span class="username">홍길동님</span>
          <button @click="router.push('/login')" class="logout-btn">로그아웃</button>
        </div>
      </div>
    </header>

    <!-- 메인 콘텐츠 -->
    <main class="main-content">
      <div class="content-wrapper">
        <div class="page-header">
          <h1 class="page-title">식단 수정</h1>
        </div>

        <div class="form-card">
          <!-- 네트워크 오류 메시지 -->
          <div v-if="networkError" class="network-error">
            {{ errorMessage }}
          </div>

          <form @submit.prevent="handleSubmit">
            <!-- 식사 타입 선택 -->
            <div class="form-section">
              <label class="form-label">식사 시간</label>
              <div class="meal-type-buttons">
                <button
                  v-for="type in ['아침', '점심', '저녁', '간식']"
                  :key="type"
                  type="button"
                  :class="['meal-type-btn', { active: mealType === type }]"
                  @click="mealType = type"
                >
                  {{ type }}
                </button>
              </div>
            </div>

            <!-- 음식 목록 -->
            <div class="form-section">
              <div class="section-header">
                <label class="form-label">음식 정보</label>
                <button type="button" class="add-food-btn" @click="addFood">
                  + 음식 추가
                </button>
              </div>

              <div class="food-list">
                <div v-for="(food, index) in foods" :key="index" class="food-row">
                  <div class="food-input-group autocomplete-wrapper">
                    <input
                      v-model="food.name"
                      type="text"
                      placeholder="음식명 (예: 현미밥)"
                      class="food-input"
                      required
                      @input="handleFoodNameInput($event, index)"
                      @focus="handleFoodNameFocus(index)"
                    />
                    <!-- 자동완성 드롭다운 -->
                    <div
                      v-if="showAutocomplete && activeFoodIndex === index"
                      class="autocomplete-dropdown"
                    >
                      <div
                        v-for="(result, idx) in searchResults"
                        :key="idx"
                        class="autocomplete-item"
                        @mousedown="selectFood(result, index)"
                      >
                        <div class="food-name">{{ result.name }}</div>
                        <div class="food-calorie-info">
                          <span v-if="result.caloriePerG">{{ result.caloriePerG }}kcal/100g</span>
                          <span v-if="result.caloriePerG && result.caloriePerMl"> · </span>
                          <span v-if="result.caloriePerMl">{{ result.caloriePerMl }}kcal/100ml</span>
                        </div>
                      </div>
                      <div v-if="searchResults.length === 0" class="no-results">
                        검색 결과가 없습니다
                      </div>
                    </div>
                  </div>
                  <div class="food-input-group amount-input-group">
                    <input
                      v-model.number="food.amount"
                      type="number"
                      placeholder="양"
                      class="food-input amount-input"
                      required
                      min="0"
                    />
                    <select
                      v-model="food.unit"
                      class="unit-select"
                    >
                      <option
                        v-for="unit in unitOptions"
                        :key="unit"
                        :value="unit"
                        :disabled="(unit === 'g' && !food.caloriePerG) || (unit === 'ml' && !food.caloriePerMl)"
                      >
                        {{ unit }}
                      </option>
                    </select>
                  </div>
                  <div class="food-input-group calorie-input-group">
                    <input
                      :value="calculateCalorie(food)"
                      type="number"
                      placeholder="칼로리"
                      class="food-input calorie-input"
                      readonly
                    />
                    <span class="calorie-unit">kcal</span>
                  </div>
                  <button
                    v-if="foods.length > 1"
                    type="button"
                    class="remove-btn"
                    @click="removeFood(index)"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <!-- 총 칼로리 -->
              <div class="total-calories">
                <span class="total-label">총 칼로리</span>
                <span class="total-value">{{ totalCalories }} kcal</span>
              </div>
            </div>

            <!-- 버튼 -->
            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="handleCancel">
                취소
              </button>
              <button type="submit" class="submit-btn">
                식단 수정
              </button>
            </div>
          </form>
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
.add-diet-container {
  min-height: 100vh;
  background-color: #F5F7FA;
}

/* 헤더 */
.header {
  background: #FFFFFF;
  border-bottom: 1px solid #E0E0E0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #333333;
}

.nav-menu {
  display: flex;
  gap: 32px;
}

.nav-item {
  color: #666666;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
  padding: 8px 0;
  border-bottom: 2px solid transparent;
}

.nav-item:hover,
.nav-item.active {
  color: #4CAF50;
  border-bottom-color: #4CAF50;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 16px;
}

.username {
  font-size: 14px;
  color: #333333;
  font-weight: 500;
}

.logout-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  color: #666666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  border-color: #4CAF50;
  color: #4CAF50;
}

/* 메인 콘텐츠 */
.main-content {
  padding: 40px;
}

.content-wrapper {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #333333;
}

/* 폼 카드 */
.form-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 네트워크 오류 메시지 */
.network-error {
  background: #FFEBEE;
  color: #D32F2F;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  border: 1px solid #FFCDD2;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.form-section {
  margin-bottom: 32px;
}

.form-label {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

/* 식사 타입 버튼 */
.meal-type-buttons {
  display: flex;
  gap: 12px;
}

.meal-type-btn {
  flex: 1;
  padding: 14px;
  background: #F8F9FA;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #666666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.meal-type-btn:hover {
  border-color: #4CAF50;
  color: #4CAF50;
}

.meal-type-btn.active {
  background: #E8F5E9;
  border-color: #4CAF50;
  color: #4CAF50;
}

/* 음식 추가 버튼 */
.add-food-btn {
  padding: 8px 16px;
  background: #4CAF50;
  color: #FFFFFF;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
}

.add-food-btn:hover {
  background: #45A049;
}

/* 음식 목록 */
.food-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 총 칼로리 */
.total-calories {
  margin-top: 24px;
  padding: 16px 20px;
  background: #F5F7FA;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 2px solid #E8F5E9;
}

.total-label {
  font-size: 16px;
  font-weight: 700;
  color: #333333;
}

.total-value {
  font-size: 20px;
  font-weight: 700;
  color: #4CAF50;
}

.food-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr auto;
  gap: 12px;
  align-items: center;
}

.food-input-group {
  display: flex;
  flex-direction: column;
}

.amount-input-group {
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.amount-input {
  flex: 1;
}

.unit-select {
  padding: 12px 8px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 15px;
  color: #333333;
  background: #FFFFFF;
  cursor: pointer;
  transition: border-color 0.3s ease;
  min-width: 60px;
}

.unit-select:focus {
  outline: none;
  border-color: #4CAF50;
}

.unit-select option:disabled {
  color: #CCCCCC;
  background: #F5F5F5;
}

.calorie-input-group {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
}

.calorie-input {
  flex: 1;
}

.calorie-unit {
  font-size: 14px;
  color: #666666;
  font-weight: 600;
  min-width: 40px;
}

.autocomplete-wrapper {
  position: relative;
}

.food-input {
  padding: 12px 16px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 15px;
  color: #333333;
  background: #FFFFFF;
  transition: border-color 0.3s ease;
}

.food-input:focus {
  outline: none;
  border-color: #4CAF50;
}

.food-input::placeholder {
  color: #AAAAAA;
}

/* 자동완성 드롭다운 */
.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 250px;
  overflow-y: auto;
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  margin-top: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.autocomplete-item {
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s ease;
  border-bottom: 1px solid #F5F5F5;
}

.autocomplete-item:last-child {
  border-bottom: none;
}

.autocomplete-item:hover {
  background: #F5F7FA;
}

.food-name {
  font-size: 15px;
  color: #333333;
  font-weight: 500;
}

.food-calorie-info {
  font-size: 12px;
  color: #4CAF50;
  font-weight: 600;
  white-space: nowrap;
}

.no-results {
  padding: 16px;
  text-align: center;
  color: #999999;
  font-size: 14px;
}

.remove-btn {
  width: 36px;
  height: 36px;
  background: #FFE0E0;
  color: #F44336;
  border: none;
  border-radius: 6px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: #F44336;
  color: #FFFFFF;
}

/* 액션 버튼 */
.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 40px;
}

.cancel-btn,
.submit-btn {
  padding: 14px 32px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: transparent;
  border: 1px solid #E0E0E0;
  color: #666666;
}

.cancel-btn:hover {
  border-color: #333333;
  color: #333333;
}

.submit-btn {
  background: #4CAF50;
  border: none;
  color: #FFFFFF;
}

.submit-btn:hover {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* 토스트 메시지 */
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
  z-index: 1000;
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
@media (max-width: 768px) {
  .food-row {
    grid-template-columns: 1fr;
  }

  .remove-btn {
    width: 100%;
  }

  .meal-type-buttons {
    flex-direction: column;
  }

  .toast-message {
    bottom: 20px;
    max-width: 90%;
  }
}
</style>
