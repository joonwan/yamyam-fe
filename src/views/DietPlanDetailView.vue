<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import { dietPlanApi, dailyDietApi } from '@/api';
import { formatDate, formatDateDisplay, formatDateDot, formatDateFull, getWeekday, generateDateRange } from '@/utils';
import { calculateMealTotalCalorie, calculateDailyTotalNutrient } from '@/utils/nutrition.js';
import { MEAL_TYPE_LABELS, MEAL_TYPE_LIST } from '@/constants';
// Chart imports
import { Chart as ChartJS, registerables } from 'chart.js';
import { Line, Bar } from 'vue-chartjs';

ChartJS.register(...registerables);

const router = useRouter();
const route = useRoute();

// --- Helper Functions ---
const MEAL_COLOR_MAP = {
  '아침': { main: '#FF9800', lightBg: '#FFF3E0', btnBg: '#FF9800', btnText: '#FFFFFF', btnHoverBg: '#E68A00' }, // Orange
  '점심': { main: '#2196F3', lightBg: '#E3F2FD', btnBg: '#2196F3', btnText: '#FFFFFF', btnHoverBg: '#1A7ADB' }, // Blue
  '저녁': { main: '#9C27B0', lightBg: '#F3E5F5', btnBg: '#9C27B0', btnText: '#FFFFFF', btnHoverBg: '#8D22A0' }, // Deep Purple
  '간식': { main: '#E91E63', lightBg: '#FCE4EC', btnBg: '#E91E63', btnText: '#FFFFFF', btnHoverBg: '#D1195A' }  // Pink
};

const getMealColors = (mealTypeLabel) => MEAL_COLOR_MAP[mealTypeLabel] || { main: '#4CAF50', lightBg: '#E8F5E9', btnBg: '#E8F5E9', btnHover: '#45A049' };

// --- Refs ---
const dietPlan = ref(null);
const selectedDate = ref(null);
const dailyDiet = ref(null);
const allDailyDiets = ref([]);
const trendData = ref({
  dates: [],
  calories: [],
  protein: [],
  carbs: [],
  fat: [],
  sugar: [],
  sodium: [],
  cholesterol: [],
  saturatedFat: [],
  transFat: []
});
const isLoading = ref(true);
const networkError = ref(false);
const errorMessage = ref('');
const showToast = ref(false);
const toastMessage = ref('');
const showCreateDailyModal = ref(false);
const dailyDescription = ref('');
const isCreatingDaily = ref(false);
const activeTab = ref('dailyDiet'); // 'dailyDiet' 또는 'trends'
const currentUserId = ref(localStorage.getItem('userId') || null);


// --- Computed ---
const dateList = computed(() => {
  if (!dietPlan.value) return [];
  return generateDateRange(dietPlan.value.startDate, dietPlan.value.endDate);
});

const dailyTotalCalorie = computed(() => {
  return calculateDailyTotalNutrient(dailyDiet.value, 'energyPer100');
});

// 자신의 식단인지 확인
const isOwner = computed(() => {
  if (!dietPlan.value || !currentUserId.value) return false;
  return dietPlan.value.authorId === parseInt(currentUserId.value);
});


// --- Functions ---

// 토스트 메시지
const displayToast = (message) => {
  toastMessage.value = message;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

// 특정 날짜의 daily diet 조회
const fetchDailyDiet = async (date) => {
  if (!dietPlan.value) return;

  try {
    const dateStr = formatDate(date);
    const response = await dailyDietApi.getByDate(dietPlan.value.id, dateStr);

    // If response.data is null or dailyDietId is missing, it means no daily diet for this date.
    // Explicitly set dailyDiet.value to null in this case.
    if (!response.data || !response.data.dailyDietId) {
      dailyDiet.value = null;
      return;
    }

    dailyDiet.value = {
      dailyDietId: response.data.dailyDietId,
      date: response.data.date,
      dayOfWeek: response.data.dayOfWeek,
      description: response.data.description || '',
      breakfast: response.data.breakfast || null, // MealDetailResponse object or null
      lunch: response.data.lunch || null,
      dinner: response.data.dinner || null,
      snack: response.data.snack || null
    };
  } catch (error) {
    console.error('일일 식단 조회 실패:', error);
    // If it's a 404, it means no daily diet for this date, so clear dailyDiet
    if (error.response && error.response.status === 404) {
      dailyDiet.value = null;
    } else {
      networkError.value = true;
      errorMessage.value = '데이터를 불러올 수 없습니다';
    }
  } finally {
    // isLoading is managed by fetchDietPlan for initial load
  }
};

// 날짜 선택 (템플릿에서 호출됨)
const selectDate = async (date) => {
  selectedDate.value = date;
  await fetchDailyDiet(date);
};


// 모든 일일 식단 데이터를 가져오는 함수 (추이 분석용)
const fetchAllDailyDietsForPlan = async () => {
  if (!dietPlan.value) return;

  try {
    const dietPlanId = dietPlan.value.id;
    const dates = dateList.value;

    const detailedDailyDietPromises = dates.map(async (date) => {
      const dateStr = formatDate(date);
      try {
        const response = await dailyDietApi.getByDate(dietPlanId, dateStr); // Corrected typo
        return response.data;
      } catch (error) {
        if (error.response && error.response.status === 404) {
          return { date: dateStr, breakfast: null, lunch: null, dinner: null, snack: null, dailyDietId: null };
        }
        console.error(`일일 식단(${dateStr}) 가져오기 실패:`, error);
        return null;
      }
    });

    const results = await Promise.all(detailedDailyDietPromises);
    allDailyDiets.value = results.filter(data => data !== null && data.dailyDietId !== null);
    
  } catch (error) {
    console.error('전체 일일 식단 목록 가져오기 실패:', error);
  }
};

// 가져온 일일 식단 데이터에서 추이 분석용 데이터 가공
const processTrendData = () => {
  const dates = [];
  const calories = [];
  const protein = [];
  const carbs = [];
  const fat = [];
  const sugar = [];
  const sodium = [];
  const cholesterol = [];
  const saturatedFat = [];
  const transFat = [];

  allDailyDiets.value.forEach(dailyDietData => {
    const formattedDate = formatDateDisplay(new Date(dailyDietData.date));
    dates.push(formattedDate);

    calories.push(calculateDailyTotalNutrient(dailyDietData, 'energyPer100'));
    protein.push(calculateDailyTotalNutrient(dailyDietData, 'proteinPer100'));
    carbs.push(calculateDailyTotalNutrient(dailyDietData, 'carbohydratePer100'));
    fat.push(calculateDailyTotalNutrient(dailyDietData, 'fatPer100'));
    sugar.push(calculateDailyTotalNutrient(dailyDietData, 'sugarPer100'));
    sodium.push(calculateDailyTotalNutrient(dailyDietData, 'sodiumPer100'));
    cholesterol.push(calculateDailyTotalNutrient(dailyDietData, 'cholesterolPer100'));
    saturatedFat.push(calculateDailyTotalNutrient(dailyDietData, 'saturatedFatPer100'));
    transFat.push(calculateDailyTotalNutrient(dailyDietData, 'transFatPer100'));
  });

  trendData.value = {
    dates,
    calories,
    protein,
    carbs,
    fat,
    sugar,
    sodium,
    cholesterol,
    saturatedFat,
    transFat
  };
};

// 식단 계획 정보 조회 (메인 로직)
const fetchDietPlan = async () => {
  const dietPlanId = route.query.id;
  if (!dietPlanId) {
    router.push('/diet');
    return;
  }

  isLoading.value = true;

  try {
    const response = await dietPlanApi.getById(dietPlanId);
    dietPlan.value = {
      id: response.data.dietPlanId,
      title: response.data.title,
      content: response.data.content,
      startDate: response.data.startDate,
      endDate: response.data.endDate,
      primary: response.data.primary,
      authorId: response.data.authorId // 소유자 ID
    };

    if (dateList.value.length > 0) {
      await selectDate(dateList.value[0]); // Await this call to ensure selectedDate and dailyDiet are populated
    }

    await fetchAllDailyDietsForPlan();
    processTrendData();

  } catch (error) {
    console.error('식단 계획 조회 실패:', error);
    networkError.value = true;
    errorMessage.value = '식단 계획을 불러올 수 없습니다';
  } finally {
    isLoading.value = false;
  }
};

// 일일 식단 생성 모달 열기
const openCreateDailyModal = () => {
  dailyDescription.value = '';
  showCreateDailyModal.value = true;
};

// 일일 식단 생성 모달 닫기
const closeCreateDailyModal = () => {
  showCreateDailyModal.value = false;
  dailyDescription.value = '';
};

// 일일 식단 생성 (또는 수정)
const createDailyDiet = async () => {
  if (!selectedDate.value) {
    displayToast('날짜를 선택해주세요');
    return;
  }

  isCreatingDaily.value = true;

  try {
    const dateStr = formatDate(selectedDate.value);
    await dailyDietApi.create(dietPlan.value.id, {
      date: dateStr,
      description: dailyDescription.value.trim() || ''
    });

    displayToast('일일 식단이 생성되었습니다');
    closeCreateDailyModal();
    await fetchDailyDiet(selectedDate.value); // Refresh data for selected date
    // Also re-fetch all daily diets for trends
    await fetchAllDailyDietsForPlan();
    processTrendData();

  } catch (error) {
    console.error('일일 식단 생성 실패:', error);
    networkError.value = true;
    errorMessage.value = error.response?.data?.message || '생성에 실패했습니다';
  } finally {
    isCreatingDaily.value = false;
  }
};

// 식사 상세 페이지로 이동
const goToMealDetail = (mealType) => {
  if (!dailyDiet.value || !dailyDiet.value.dailyDietId) {
    displayToast('먼저 일일 식단을 생성해주세요');
    return;
  }

  // Access mealId from the MealDetailResponse object directly
  const mealId = dailyDiet.value[mealType.toLowerCase()]?.mealId || null;

  router.push({
    path: '/diet/meal',
    query: {
      dietPlanId: dietPlan.value.id,
      dailyDietId: dailyDiet.value.dailyDietId,
      mealType: mealType,
      ...(mealId && { mealId: mealId }),
      returnDate: formatDate(selectedDate.value) // Pass current selected date
    }
  });
};


// 식사 삭제
const deleteMeal = async (mealType) => {
  if (!dailyDiet.value) return;

  const mealLabel = MEAL_TYPE_LABELS[mealType];
  if (!confirm(`${mealLabel}을(를) 삭제하시겠습니까?`)) {
    return;
  }

  try {
    displayToast('식사 삭제 기능은 백엔드 API 수정 후 구현 예정입니다');
    // TODO: 백엔드에서 mealId를 응답에 포함하도록 수정 후
    // const mealIdToDelete = dailyDiet.value[mealType.toLowerCase()]?.mealId;
    // if (mealIdToDelete) {
    //   await mealApi.delete(dietPlan.value.id, dailyDiet.value.dailyDietId, mealIdToDelete);
    //   await fetchDailyDiet(selectedDate.value);
    //   await fetchAllDailyDietsForPlan();
    //   processTrendData();
    // }

  } catch (error) {
    console.error('식사 삭제 실패:', error);
    networkError.value = true;
    errorMessage.value = error.response?.data?.message || '삭제에 실패했습니다';
  } finally {
    setTimeout(() => {
      networkError.value = false;
    }, 3000);
  }
};

// 식단 계획 삭제
const handleDelete = async () => {
  if (!confirm('정말 이 식단 계획을 삭제하시겠습니까?')) {
    return;
  }

  try {
    await dietPlanApi.delete(dietPlan.value.id);
    displayToast('식단 계획이 삭제되었습니다');

    setTimeout(() => {
      router.push('/diet');
    }, 500);
  } catch (error) {
    console.error('삭제 실패:', error);
    networkError.value = true;
    errorMessage.value = error.response?.data?.message || '삭제에 실패했습니다';
  } finally {
    setTimeout(() => {
      networkError.value = false;
    }, 3000);
  }
};

const goToUpdatePage = () => {
  router.push({
    path: `/diet/plan/update`,
    query: { id: dietPlan.value.id }
  });
};

// 대표 식단으로 설정
const setPrimaryDietPlan = async () => {
  if (!dietPlan.value || dietPlan.value.primary) return;

  if (!confirm('이 식단을 대표 식단으로 설정하시겠습니까?')) {
    return;
  }

  try {
    await dietPlanApi.updatePrimary(dietPlan.value.id);
    dietPlan.value.primary = true;
    displayToast('대표 식단으로 설정되었습니다');
  } catch (error) {
    console.error('대표 식단 설정 실패:', error);
    networkError.value = true;
    errorMessage.value = error.response?.data?.message || '대표 식단 설정에 실패했습니다';
  } finally {
    setTimeout(() => {
      networkError.value = false;
    }, 3000);
  }
};

// 뒤로 가기
const handleBack = () => {
  router.push('/diet');
};

// 식단 가져오기
const copyDietPlan = async () => {
  if (!confirm('이 식단을 내 식단으로 가져오시겠습니까?\n모든 일일 식단과 식사 정보가 복사됩니다.')) {
    return;
  }

  try {
    const response = await dietPlanApi.copy(dietPlan.value.id);

    // 201 Created - 새로 복사된 경우
    if (response.status === 201) {
      const location = response.headers.location;
      const newDietPlanId = location ? location.split('/').pop() : null;

      displayToast('식단이 성공적으로 복사되었습니다!');

      // 복사된 식단 상세 페이지로 이동
      setTimeout(() => {
        if (newDietPlanId) {
          router.push({
            name: 'diet-plan-detail',
            query: { id: newDietPlanId }
          });
        } else {
          router.push('/diet');
        }
      }, 1000);
    }
    // 200 OK - 이미 본인 식단인 경우
    else if (response.status === 200) {
      displayToast('이미 본인의 식단입니다.');
    }
  } catch (error) {
    console.error('식단 복사 실패:', error);
    networkError.value = true;
    errorMessage.value = error.response?.data?.message || '식단 복사에 실패했습니다.';

    setTimeout(() => {
      networkError.value = false;
    }, 3000);
  }
};

onMounted(async () => {
  await fetchDietPlan(); // Ensure dietPlan is loaded first

  const returnDateQuery = route.query.returnDate;
  if (returnDateQuery) {
    // If returning from meal detail, select that date
    const dateObj = new Date(returnDateQuery);
    if (!isNaN(dateObj)) { // Check for valid date
      await selectDate(dateObj);
    }
  } else if (dietPlan.value && dateList.value.length > 0) {
    // Otherwise, select the first date in the plan (original logic)
    await selectDate(dateList.value[0]);
  }
});
</script>

<template>
  <div class="diet-plan-detail-container">
    <AppHeader active-page="diet" />

    <main class="main-content">
      <div v-if="networkError" class="network-error">
        {{ errorMessage }}
      </div>

      <div v-if="!isLoading && dietPlan" class="content-wrapper">
        <!-- 헤더 섹션 -->
        <div class="page-header">
          <div class="header-left">
            <button class="back-btn" @click="handleBack">← 뒤로</button>
            <h1 class="page-title">{{ dietPlan.title }}</h1>
            <span v-if="dietPlan.primary" class="primary-badge">대표 식단</span>
          </div>
          <div class="header-actions">
            <!-- 자신의 식단인 경우 -->
            <template v-if="isOwner">
              <button v-if="!dietPlan.primary" class="set-primary-btn" @click="setPrimaryDietPlan">
                대표 식단으로 설정
              </button>
              <button class="update-btn" @click="goToUpdatePage">수정</button>
              <button class="delete-btn" @click="handleDelete">삭제</button>
            </template>
            <!-- 다른 사람의 식단인 경우 -->
            <template v-else>
              <button class="copy-diet-btn" @click="copyDietPlan">
                📋 식단 가져오기
              </button>
            </template>
          </div>
        </div>

        <!-- 식단 계획 정보 -->
        <div class="info-card">
          <div class="info-row">
            <span class="info-label">기간</span>
            <span class="info-value">
              {{ formatDateDot(dietPlan.startDate) }} ~ {{ formatDateDot(dietPlan.endDate) }}
            </span>
          </div>
          <div v-if="dietPlan.content" class="info-row">
            <span class="info-label">설명</span>
            <span class="info-value">{{ dietPlan.content }}</span>
          </div>
        </div>

        <!-- 탭 네비게이션 -->
        <div class="tabs">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'dailyDiet' }"
            @click="activeTab = 'dailyDiet'"
          >
            일일 식단
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'trends' }"
            @click="activeTab = 'trends'"
          >
            영양 추이
          </button>
        </div>

        <!-- 일일 식단 탭 -->
        <div v-if="activeTab === 'dailyDiet'" class="daily-diet-section">
          <!-- 날짜 선택 -->
          <div class="date-selector">
            <div class="date-list">
              <button
                v-for="date in dateList"
                :key="formatDate(date)"
                class="date-item"
                :class="{ active: selectedDate && formatDate(selectedDate) === formatDate(date) }"
                @click="selectDate(date)"
              >
                <div class="date-day">{{ formatDateDisplay(date) }}</div>
                <div class="date-weekday">{{ getWeekday(date) }}</div>
              </button>
            </div>
          </div>

          <!-- 선택된 날짜의 식단 정보 -->
          <div v-if="selectedDate" class="selected-date-info">
            <h2 class="section-title">
              {{ formatDateFull(selectedDate) }}
            </h2>

            <!-- 일일 식단이 없는 경우 -->
            <div v-if="!dailyDiet" class="empty-daily-diet">
              <p class="empty-message">아직 이 날짜의 식단이 생성되지 않았습니다</p>
              <button v-if="isOwner" class="create-daily-btn" @click="openCreateDailyModal">
                일일 식단 생성
              </button>
            </div>

            <!-- 일일 식단이 있는 경우 -->
            <div v-else class="daily-diet-content">
              <!-- 총 칼로리 표시 -->
              <div class="calorie-summary">
                <span class="calorie-label">총 칼로리</span>
                <span class="calorie-value">{{ Math.round(dailyTotalCalorie) }} kcal</span>
              </div>

              <!-- 메모 -->
              <div v-if="dailyDiet.description" class="daily-description">
                <h3 class="description-title">메모</h3>
                <p class="description-text">{{ dailyDiet.description }}</p>
              </div>

              <!-- 식사 목록 -->
              <div class="meals-grid">
                                                    <div
                                                      v-for="mealType in MEAL_TYPE_LIST"
                                                      :key="mealType.value"
                                                      class="meal-card"
                                                      :style="{
                                                        borderColor: getMealColors(mealType.label).main,
                                                        backgroundColor: getMealColors(mealType.label).lightBg,
                                                        '--meal-main-color': getMealColors(mealType.label).main
                                                      }"
                                                    >                                  <div class="meal-header">
                                    <h3 class="meal-title" :style="{ color: getMealColors(mealType.label).main }">{{ mealType.label }}</h3>
                                    <button
                                      v-if="isOwner"
                                      class="meal-action-btn"
                                      :style="{
                                        color: getMealColors(mealType.label).btnText,
                                        backgroundColor: getMealColors(mealType.label).btnBg,
                                        '--meal-button-hover-color': getMealColors(mealType.label).btnHoverBg
                                      }"
                                      @click="goToMealDetail(mealType.value)"
                                    >
                                      {{ dailyDiet[mealType.value.toLowerCase()] ? '상세보기' : '추가' }}
                                    </button>
                                    <button
                                      v-else-if="dailyDiet[mealType.value.toLowerCase()]"
                                      class="meal-action-btn view-only-btn"
                                      :style="{
                                        color: getMealColors(mealType.label).btnText,
                                        backgroundColor: getMealColors(mealType.label).btnBg,
                                        '--meal-button-hover-color': getMealColors(mealType.label).btnHoverBg
                                      }"
                                      @click="goToMealDetail(mealType.value)"
                                    >
                                      보기
                                    </button>
                                  </div>
                  <div v-if="dailyDiet[mealType.value.toLowerCase()]" class="meal-content">
                    <div
                      v-for="(food, idx) in dailyDiet[mealType.value.toLowerCase()].mealFoods"
                      :key="idx"
                      class="food-item"
                    >
                      <span class="food-name">{{ food.foodName }}</span>
                      <span class="food-quantity">{{ food.quantity }}{{ food.baseUnit }}</span>
                    </div>
                    <div class="meal-calorie" :style="{ color: getMealColors(mealType.label).main }">
                      총 {{ Math.round(calculateMealTotalCalorie(dailyDiet[mealType.value.toLowerCase()].mealFoods)) }} kcal
                    </div>
                  </div>

                  <div v-else class="meal-empty">
                    <p class="empty-text">등록된 식사가 없습니다</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 영양 추이 탭 -->
        <div v-if="activeTab === 'trends'" class="trends-section">
          <div v-if="trendData.dates.length === 0" class="empty-trends">
            <p class="empty-message">아직 기록된 식단 데이터가 없습니다</p>
          </div>

          <div v-else class="charts-container">
            <!-- 칼로리 추이 차트 -->
            <div class="chart-card full-width">
              <h3 class="chart-title">칼로리 추이</h3>
              <Line
                :data="{
                  labels: trendData.dates,
                  datasets: [{
                    label: '칼로리 (kcal)',
                    data: trendData.calories,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.3,
                    fill: true
                  }]
                }"
                :options="{
                  responsive: true,
                  maintainAspectRatio: true,
                  aspectRatio: 2.5,
                  plugins: {
                    legend: { display: true, position: 'top' },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return context.dataset.label + ': ' + Math.round(context.parsed.y) + ' kcal';
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: { display: true, text: 'kcal' }
                    }
                  }
                }"
              />
            </div>

            <!-- 삼대 영양소 (단백질/탄수화물/지방) 추이 차트 -->
            <div class="chart-card full-width">
              <h3 class="chart-title">삼대 영양소 추이 (단백질 / 탄수화물 / 지방)</h3>
              <Bar
                :data="{
                  labels: trendData.dates,
                  datasets: [
                    {
                      label: '단백질 (g)',
                      data: trendData.protein,
                      backgroundColor: '#FF6384',
                      borderRadius: 6
                    },
                    {
                      label: '탄수화물 (g)',
                      data: trendData.carbs,
                      backgroundColor: '#36A2EB',
                      borderRadius: 6
                    },
                    {
                      label: '지방 (g)',
                      data: trendData.fat,
                      backgroundColor: '#FFCE56',
                      borderRadius: 6
                    }
                  ]
                }"
                :options="{
                  responsive: true,
                  maintainAspectRatio: true,
                  aspectRatio: 2.5,
                  plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return context.dataset.label + ': ' + Math.round(context.parsed.y) + ' g';
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: { display: true, text: 'g' }
                    }
                  }
                }"
              />
            </div>

            <!-- 당류 & 나트륨 차트 -->
            <div class="chart-card-grid">
              <div class="chart-card half-width">
                <h3 class="chart-title">당류 추이</h3>
                <Line
                  :data="{
                    labels: trendData.dates,
                    datasets: [{
                      label: '당류 (g)',
                      data: trendData.sugar,
                      borderColor: '#E91E63',
                      backgroundColor: 'rgba(233, 30, 99, 0.1)',
                      tension: 0.3,
                      fill: true
                    }]
                  }"
                  :options="{
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 1.5,
                    plugins: {
                      legend: { display: true, position: 'top' },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return context.dataset.label + ': ' + Math.round(context.parsed.y * 10) / 10 + ' g';
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: { display: true, text: 'g' }
                      }
                    }
                  }"
                />
              </div>

              <div class="chart-card half-width">
                <h3 class="chart-title">나트륨 추이</h3>
                <Line
                  :data="{
                    labels: trendData.dates,
                    datasets: [{
                      label: '나트륨 (mg)',
                      data: trendData.sodium,
                      borderColor: '#9C27B0',
                      backgroundColor: 'rgba(156, 39, 176, 0.1)',
                      tension: 0.3,
                      fill: true
                    }]
                  }"
                  :options="{
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 1.5,
                    plugins: {
                      legend: { display: true, position: 'top' },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return context.dataset.label + ': ' + Math.round(context.parsed.y * 10) / 10 + ' mg';
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: { display: true, text: 'mg' }
                      }
                    }
                  }"
                />
              </div>
            </div>

            <!-- 콜레스테롤 & 포화지방 차트 -->
            <div class="chart-card-grid">
              <div class="chart-card half-width">
                <h3 class="chart-title">콜레스테롤 추이</h3>
                <Line
                  :data="{
                    labels: trendData.dates,
                    datasets: [{
                      label: '콜레스테롤 (mg)',
                      data: trendData.cholesterol,
                      borderColor: '#FF9800',
                      backgroundColor: 'rgba(255, 152, 0, 0.1)',
                      tension: 0.3,
                      fill: true
                    }]
                  }"
                  :options="{
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 1.5,
                    plugins: {
                      legend: { display: true, position: 'top' },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return context.dataset.label + ': ' + Math.round(context.parsed.y * 10) / 10 + ' mg';
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: { display: true, text: 'mg' }
                      }
                    }
                  }"
                />
              </div>

              <div class="chart-card half-width">
                <h3 class="chart-title">포화지방 추이</h3>
                <Line
                  :data="{
                    labels: trendData.dates,
                    datasets: [{
                      label: '포화지방 (g)',
                      data: trendData.saturatedFat,
                      borderColor: '#F44336',
                      backgroundColor: 'rgba(244, 67, 54, 0.1)',
                      tension: 0.3,
                      fill: true
                    }]
                  }"
                  :options="{
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 1.5,
                    plugins: {
                      legend: { display: true, position: 'top' },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return context.dataset.label + ': ' + Math.round(context.parsed.y * 10) / 10 + ' g';
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: { display: true, text: 'g' }
                      }
                    }
                  }"
                />
              </div>
            </div>

            <!-- 트랜스지방 차트 -->
            <div class="chart-card full-width">
              <h3 class="chart-title">트랜스지방 추이</h3>
              <Line
                :data="{
                  labels: trendData.dates,
                  datasets: [{
                    label: '트랜스지방 (g)',
                    data: trendData.transFat,
                    borderColor: '#795548',
                    backgroundColor: 'rgba(121, 85, 72, 0.1)',
                    tension: 0.3,
                    fill: true
                  }]
                }"
                :options="{
                  responsive: true,
                  maintainAspectRatio: true,
                  aspectRatio: 2.5,
                  plugins: {
                    legend: { display: true, position: 'top' },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return context.dataset.label + ': ' + Math.round(context.parsed.y * 100) / 100 + ' g';
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: { display: true, text: 'g' }
                    }
                  }
                }"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="isLoading" class="loading-state">
        데이터를 불러오는 중...
      </div>
    </main>

    <!-- 일일 식단 생성 모달 -->
    <div v-if="showCreateDailyModal" class="modal-overlay" @click="closeCreateDailyModal">
      <div class="modal-content" @click.stop>
        <h2 class="modal-title">일일 식단 생성</h2>
        <p class="modal-subtitle">{{ formatDateFull(selectedDate) }}</p>

        <div class="modal-body">
          <label for="daily-description" class="modal-label">메모 (선택사항)</label>
          <textarea
            id="daily-description"
            v-model="dailyDescription"
            class="modal-textarea"
            rows="4"
            placeholder="오늘 식단에 대한 메모를 입력하세요"
          ></textarea>
        </div>

        <div class="modal-actions">
          <button class="modal-cancel-btn" @click="closeCreateDailyModal" :disabled="isCreatingDaily">
            취소
          </button>
          <button class="modal-submit-btn" @click="createDailyDiet" :disabled="isCreatingDaily">
            {{ isCreatingDaily ? '생성 중...' : '생성' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 토스트 메시지 -->
    <div v-if="showToast" class="toast-message">
      <div class="toast-icon">✓</div>
      <span class="toast-text">{{ toastMessage }}</span>
    </div>
  </div>
</template>

<style scoped>
.diet-plan-detail-container {
  min-height: 100vh;
  background-color: #F5F7FA;
}

.main-content {
  padding: 40px;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

/* 네트워크 오류 */
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
  max-width: 1200px;
  margin: 0 auto 24px;
}

/* 페이지 헤더 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  padding: 8px 16px;
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  color: #666666;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  border-color: #4CAF50;
  color: #4CAF50;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #333333;
  margin: 0;
}

.primary-badge {
  padding: 6px 16px;
  background: linear-gradient(135deg, #4CAF50 0%, #45A049 100%);
  color: #FFFFFF;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(76, 175, 80, 0.25);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.set-primary-btn,
.update-btn,
.delete-btn,
.copy-diet-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.set-primary-btn {
  background: #4CAF50;
  color: #FFFFFF;
}

.set-primary-btn:hover {
  background: #45A049;
}

.update-btn {
  background: #FFF8E1;
  color: #FFAB00;
}

.update-btn:hover {
  background: #FFAB00;
  color: #FFFFFF;
}

.delete-btn {
  background: #FFE0E0;
  color: #F44336;
}

.delete-btn:hover {
  background: #F44336;
  color: #FFFFFF;
}

.copy-diet-btn {
  background: #E3F2FD;
  color: #2196F3;
}

.copy-diet-btn:hover {
  background: #2196F3;
  color: #FFFFFF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

/* 정보 카드 */
.info-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #F0F0F0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: #666666;
  font-weight: 600;
}

.info-value {
  font-size: 16px;
  color: #333333;
  font-weight: 500;
}

/* 탭 */
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
  background: #FFFFFF;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.tab-btn {
  flex: 1;
  padding: 12px 24px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #666666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: #4CAF50;
  color: #FFFFFF;
}

/* 날짜 선택 */
.date-selector {
  margin-bottom: 32px;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.date-list {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 8px 0;
}

.date-list::-webkit-scrollbar {
  height: 6px;
}

.date-list::-webkit-scrollbar-track {
  background: #F5F5F5;
  border-radius: 3px;
}

.date-list::-webkit-scrollbar-thumb {
  background: #CCCCCC;
  border-radius: 3px;
}

.date-item {
  flex-shrink: 0;
  min-width: 80px;
  padding: 16px;
  background: transparent; /* Changed from #F8F9FA to transparent for better contrast with white background */
  border: 2px solid #E0E0E0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.date-item:hover {
  border-color: #4CAF50;
  background: #E8F5E9;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* Enhanced shadow on hover */
  transform: translateY(-2px); /* Lift effect on hover */
}

.date-item.active {
  background: #4CAF50;
  color: #FFFFFF;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3); /* Distinct shadow for active state */
  transform: translateY(-2px); /* Lift effect for active state */
}

.date-day {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
  color: #333333; /* Ensure dark color for visibility */
}

.date-weekday {
  font-size: 12px;
  color: #666666; /* Ensure dark enough color for visibility */
  opacity: 1; /* Remove opacity as color is explicit */
}

/* 선택된 날짜 정보 */
.selected-date-info {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 24px;
}

/* 빈 일일 식단 */
.empty-daily-diet {
  text-align: center;
  padding: 60px 20px;
}

.empty-message {
  font-size: 16px;
  color: #666666;
  margin-bottom: 24px;
}

.create-daily-btn {
  padding: 14px 32px;
  background: #4CAF50;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.create-daily-btn:hover {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* 일일 식단 콘텐츠 */
.calorie-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #4CAF50 0%, #45A049 100%);
  border-radius: 12px;
  margin-bottom: 24px;
}

.calorie-label {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.calorie-value {
  font-size: 28px;
  font-weight: 700;
  color: #FFFFFF;
}

/* 메모 */
.daily-description {
  background: #F8F9FA;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.description-title {
  font-size: 14px;
  font-weight: 700;
  color: #666666;
  margin-bottom: 8px;
}

.description-text {
  font-size: 16px;
  color: #333333;
  line-height: 1.6;
}

/* 식사 그리드 */
.meals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.meal-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px 20px 50px 20px; /* Increased bottom padding to accommodate absolute calorie text */
  border: 2px solid #E8E8E8;
  transition: all 0.3s ease;
  position: relative;
}

.meal-card:hover {
  border-color: var(--meal-main-color);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.1);
}

.meal-card:hover {
  border-color: var(--meal-main-color); /* Dynamically set via style binding */
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.1); /* Keep generic shadow or refine */
}



.meal-action-btn {
  position: absolute; /* Position to top-right */
  top: 15px; /* Adjust as needed */
  right: 15px; /* Adjust as needed */
  padding: 8px 16px; /* Slightly reduced padding */
  border: none;
  border-radius: 6px; /* Slightly smaller radius */
  font-size: 14px; /* Slightly smaller font */
  font-weight: 700; /* Bolder font */
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Subtle shadow for prominence */
}

.meal-action-btn:hover {
  background: var(--meal-button-hover-color); /* Dynamically set via style binding */
  color: #FFFFFF;
}

.meal-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.food-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #F5F5F5;
}

.food-item:last-child {
  border-bottom: none;
}

.food-name {
  font-size: 14px;
  color: #333333;
  font-weight: 500;
}

.food-quantity {
  font-size: 13px;
  color: #666666;
}

.meal-calorie {
  position: absolute; /* Position to bottom-right */
  bottom: 15px; /* Adjust as needed */
  right: 15px; /* Adjust as needed */
  /* Remove flow-based spacing */
  margin-top: 0;
  padding-top: 0;
  border-top: none; /* No longer needs a top border for separation */

  font-size: 15px;
  font-weight: 700;
  color: #4CAF50; /* Color will be dynamically overridden by inline style */
  text-align: right;
  z-index: 1; /* Ensure it's above other elements if any slight overlap */
}

.meal-empty {
  text-align: center;
  padding: 40px 20px;
}

.empty-text {
  font-size: 14px;
  color: #999999;
}

/* 추이 섹션 */
.trends-section {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.empty-trends {
  text-align: center;
  padding: 60px 20px;
}

.charts-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.chart-card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.chart-card {
  background: #F8F9FA;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.chart-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.chart-card.full-width {
  width: 100%;
}

.chart-card.half-width {
  width: 100%;
}

.chart-title {
  font-size: 18px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #E0E0E0;
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
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 8px;
}

.modal-subtitle {
  font-size: 14px;
  color: #666666;
  margin-bottom: 24px;
}

.modal-body {
  margin-bottom: 24px;
}

.modal-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 8px;
}

.modal-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  background-color: #F8F9FA; /* Changed from default to light gray */
  color: #333333; /* Ensure text color is dark for visibility */
}

.modal-textarea:focus {
  outline: none;
  border-color: #4CAF50;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-cancel-btn,
.modal-submit-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-cancel-btn {
  background: transparent;
  border: 1px solid #E0E0E0;
  color: #666666;
}

.modal-cancel-btn:hover:not(:disabled) {
  border-color: #333333;
  color: #333333;
}

.modal-submit-btn {
  background: #4CAF50;
  border: none;
  color: #FFFFFF;
}

.modal-submit-btn:hover:not(:disabled) {
  background: #45A049;
}

.modal-submit-btn:disabled {
  background: #CCCCCC;
  cursor: not-allowed;
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

/* 로딩 상태 */
.loading-state {
  text-align: center;
  padding: 60px 20px;
  font-size: 16px;
  color: #666666;
}

/* 반응형 */
@media (max-width: 1024px) {
  .chart-card-grid {
    grid-template-columns: 1fr;
  }

  .chart-card {
    padding: 20px;
  }

  .chart-title {
    font-size: 16px;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 20px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    gap: 12px;
  }

  .page-title {
    font-size: 24px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .set-primary-btn,
  .update-btn,
  .delete-btn {
    flex: 1;
    min-width: 120px;
  }

  .info-card {
    padding: 20px;
  }

  .tabs {
    padding: 6px;
  }

  .tab-btn {
    padding: 10px 16px;
    font-size: 14px;
  }

  .date-selector {
    padding: 16px;
  }

  .date-item {
    min-width: 70px;
    padding: 12px;
  }

  .date-day {
    font-size: 14px;
  }

  .selected-date-info {
    padding: 24px 20px;
  }

  .section-title {
    font-size: 20px;
  }

  .meals-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .meal-card {
    padding: 16px;
  }

  .calorie-summary {
    flex-direction: column;
    gap: 12px;
    text-align: center;
    padding: 16px;
  }

  .calorie-value {
    font-size: 24px;
  }

  .chart-card-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .chart-card {
    padding: 16px;
  }

  .modal-content {
    padding: 24px;
    width: 95%;
  }

  .toast-message {
    bottom: 20px;
    max-width: 90%;
    padding: 12px 20px;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 16px;
  }

  .page-title {
    font-size: 20px;
  }

  .back-btn {
    font-size: 13px;
    padding: 6px 12px;
  }

  .set-primary-btn,
  .update-btn,
  .delete-btn {
    font-size: 13px;
    padding: 8px 16px;
    min-width: 100px;
  }

  .info-card {
    padding: 16px;
  }

  .info-label,
  .info-value {
    font-size: 13px;
  }

  .tab-btn {
    padding: 8px 12px;
    font-size: 13px;
  }

  .date-item {
    min-width: 60px;
    padding: 10px;
  }

  .date-day {
    font-size: 13px;
  }

  .date-weekday {
    font-size: 11px;
  }

  .selected-date-info {
    padding: 20px 16px;
  }

  .section-title {
    font-size: 18px;
  }

  .calorie-label {
    font-size: 14px;
  }

  .calorie-value {
    font-size: 22px;
  }

  .meal-title {
    font-size: 16px;
  }

  .meal-action-btn {
    font-size: 13px;
    padding: 5px 12px;
  }

  .food-name,
  .food-quantity {
    font-size: 13px;
  }

  .chart-title {
    font-size: 15px;
    margin-bottom: 16px;
  }

  .modal-content {
    padding: 20px;
  }

  .modal-title {
    font-size: 20px;
  }
}
</style>