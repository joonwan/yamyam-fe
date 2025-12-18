<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { postApi } from '@/api'
import { dietPlanApi } from '@/api'

const router = useRouter()
const route = useRoute()

// 수정 모드 여부
const isEditMode = computed(() => !!route.params.id)
const postId = computed(() => isEditMode.value ? parseInt(route.params.id) : null)

// 폼 데이터
const title = ref('')
const content = ref('')
const selectedDietPlan = ref(null)

// Diet Plan 관련
const dietPlans = ref([])
const showDietPlanModal = ref(false)
const loadingDietPlans = ref(false)

// 상태
const loading = ref(false)
const submitting = ref(false)

// 취소 확인 모달
const showCancelModal = ref(false)

// Diet Plan 목록 조회
const fetchDietPlans = async () => {
  try {
    loadingDietPlans.value = true
    const response = await dietPlanApi.getMyList()
    dietPlans.value = response.data
  } catch (err) {
    console.error('식단 계획 조회 실패:', err)
    alert('식단 계획을 불러오는데 실패했습니다.')
  } finally {
    loadingDietPlans.value = false
  }
}

// Diet Plan 선택 모달 열기
const openDietPlanModal = async () => {
  await fetchDietPlans()
  showDietPlanModal.value = true
}

// Diet Plan 선택/해제
const selectDietPlan = (dietPlan) => {
  // 이미 선택된 식단을 다시 클릭하면 선택 해제
  if (selectedDietPlan.value?.dietPlanId === dietPlan.dietPlanId) {
    selectedDietPlan.value = null
    showDietPlanModal.value = false
  } else {
    // 새로운 식단 선택
    selectedDietPlan.value = dietPlan
    showDietPlanModal.value = false
  }
}

// Diet Plan 선택 해제
const removeDietPlan = () => {
  selectedDietPlan.value = null
}

// 게시글 조회 (수정 모드일 때)
const fetchPost = async () => {
  if (!isEditMode.value) return

  try {
    loading.value = true
    const data = await postApi.getPost(postId.value)
    title.value = data.title
    content.value = data.content

    // 식단 계획이 있으면 선택된 상태로 설정
    if (data.dietPlan) {
      selectedDietPlan.value = data.dietPlan
    }
  } catch (err) {
    console.error('게시글 조회 실패:', err)
    alert('게시글을 불러오는데 실패했습니다.')
    router.push('/board')
  } finally {
    loading.value = false
  }
}

// 폼 제출
const handleSubmit = async () => {
  // 유효성 검사
  if (!title.value.trim()) {
    alert('제목을 입력해주세요.')
    return
  }

  if (!content.value.trim()) {
    alert('내용을 입력해주세요.')
    return
  }

  try {
    submitting.value = true

    const postData = {
      title: title.value.trim(),
      content: content.value.trim(),
      dietPlanId: selectedDietPlan.value?.dietPlanId || null
    }

    if (isEditMode.value) {
      // 수정
      await postApi.updatePost(postId.value, postData)
      alert('게시글이 수정되었습니다.')
      router.push(`/board/${postId.value}`)
    } else {
      // 작성
      const result = await postApi.createPost(postData)
      alert('게시글이 작성되었습니다.')
      if (result.postId) {
        router.push(`/board/${result.postId}`)
      } else {
        router.push('/board')
      }
    }
  } catch (err) {
    console.error('게시글 저장 실패:', err)
    if (err.response?.data?.message) {
      alert(err.response.data.message)
    } else if (err.response?.data?.fieldErrors) {
      const errors = err.response.data.fieldErrors
        .map(e => `${e.field}: ${e.reason}`)
        .join('\n')
      alert(errors)
    } else {
      alert(isEditMode.value ? '게시글 수정에 실패했습니다.' : '게시글 작성에 실패했습니다.')
    }
  } finally {
    submitting.value = false
  }
}

// 취소
const handleCancel = () => {
  if (title.value || content.value) {
    showCancelModal.value = true
  } else {
    goBack()
  }
}

const confirmCancel = () => {
  showCancelModal.value = false
  goBack()
}

const goBack = () => {
  if (isEditMode.value) {
    router.push(`/board/${postId.value}`)
  } else {
    router.push('/board')
  }
}

onMounted(() => {
  fetchPost()
})
</script>

<template>
  <div class="form-container">
    <!-- 상단 네비게이션 -->
    <AppHeader active-page="board" />

    <!-- 메인 콘텐츠 -->
    <main class="main-content">
      <div class="content-wrapper">
        <div class="page-header">
          <h1 class="page-title">{{ isEditMode ? '게시글 수정' : '게시글 작성' }}</h1>
        </div>

        <!-- 로딩 상태 -->
        <div v-if="loading" class="loading-container">
          <p class="loading-text">게시글을 불러오는 중...</p>
        </div>

        <!-- 글쓰기 폼 -->
        <form v-else @submit.prevent="handleSubmit" class="write-form">
          <!-- 제목 입력 -->
          <div class="form-group">
            <label class="form-label">제목 *</label>
            <input
              v-model="title"
              type="text"
              placeholder="제목을 입력하세요"
              class="form-input"
              maxlength="100"
              :disabled="submitting"
            />
          </div>

          <!-- 내용 입력 -->
          <div class="form-group">
            <label class="form-label">내용 *</label>
            <textarea
              v-model="content"
              placeholder="내용을 입력하세요"
              class="form-textarea"
              rows="15"
              :disabled="submitting"
            ></textarea>
          </div>

          <!-- 식단 선택 (선택사항) -->
          <div class="form-group">
            <label class="form-label">식단 연동 (선택)</label>
            <button
              type="button"
              @click="openDietPlanModal"
              class="select-diet-btn"
              :disabled="submitting"
            >
              🍽️ 식단 계획 선택하기
            </button>

            <!-- 선택된 식단 표시 -->
            <div v-if="selectedDietPlan" class="selected-diet-card">
              <div class="selected-diet-header">
                <div class="diet-info">
                  <span class="diet-badge">식단 선택됨</span>
                  <span class="diet-title">{{ selectedDietPlan.title }}</span>
                </div>
                <button
                  type="button"
                  @click="removeDietPlan"
                  class="remove-diet-btn"
                  :disabled="submitting"
                >
                  ✕
                </button>
              </div>
              <div class="diet-date-range">
                {{ selectedDietPlan.startDate }} ~ {{ selectedDietPlan.endDate }}
              </div>
            </div>

            <p class="form-help">
              식단 계획과 연동하려면 위 버튼을 클릭하여 선택하세요. 비워두면 식단 없이 게시글만 작성됩니다.
            </p>
          </div>

          <!-- 버튼 그룹 -->
          <div class="button-group">
            <button
              type="button"
              @click="handleCancel"
              class="cancel-btn"
              :disabled="submitting"
            >
              취소
            </button>
            <button
              type="submit"
              class="submit-btn"
              :disabled="submitting"
            >
              {{ submitting ? '저장 중...' : (isEditMode ? '수정 완료' : '작성 완료') }}
            </button>
          </div>
        </form>
      </div>
    </main>

    <!-- Diet Plan 선택 모달 -->
    <div v-if="showDietPlanModal" class="modal-overlay" @click="showDietPlanModal = false">
      <div class="modal-content diet-plan-modal" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">식단 계획 선택</h2>
          <button class="modal-close" @click="showDietPlanModal = false">✕</button>
        </div>
        <div class="modal-body">
          <!-- 로딩 상태 -->
          <div v-if="loadingDietPlans" class="modal-loading">
            <p>식단 계획을 불러오는 중...</p>
          </div>

          <!-- 식단 목록 -->
          <div v-else-if="dietPlans.length > 0" class="diet-plan-list">
            <div
              v-for="plan in dietPlans"
              :key="plan.dietPlanId"
              class="diet-plan-card"
              :class="{ selected: selectedDietPlan?.dietPlanId === plan.dietPlanId }"
              @click="selectDietPlan(plan)"
            >
              <div class="diet-plan-header">
                <h3 class="diet-plan-title">{{ plan.title }}</h3>
                <span v-if="plan.isPrimary" class="primary-badge">대표</span>
              </div>
              <div class="diet-plan-dates">
                {{ plan.startDate }} ~ {{ plan.endDate }}
              </div>
            </div>
          </div>

          <!-- 빈 상태 -->
          <div v-else class="modal-empty">
            <p>등록된 식단 계획이 없습니다.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 취소 확인 모달 -->
    <div v-if="showCancelModal" class="modal-overlay" @click="showCancelModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">{{ isEditMode ? '수정 취소' : '작성 취소' }}</h2>
          <button class="modal-close" @click="showCancelModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-message">
            {{ isEditMode ? '수정 중인' : '작성 중인' }} 내용이 있습니다. 정말 취소하시겠습니까?
          </p>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel-btn-modal" @click="showCancelModal = false">
            계속 {{ isEditMode ? '수정' : '작성' }}
          </button>
          <button class="modal-btn confirm-btn" @click="confirmCancel">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-container {
  min-height: 100vh;
  background-color: #F5F7FA;
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

/* 로딩 */
.loading-container {
  text-align: center;
  padding: 80px 20px;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.loading-text {
  font-size: 16px;
  color: #888888;
}

/* 글쓰기 폼 */
.write-form {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.form-group {
  margin-bottom: 28px;
}

.form-label {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 12px;
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  font-size: 15px;
  color: #333333;
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.form-input:disabled {
  background-color: #F5F7FA;
  cursor: not-allowed;
}

.form-textarea {
  width: 100%;
  padding: 14px 16px;
  font-size: 15px;
  color: #333333;
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  outline: none;
  transition: all 0.3s ease;
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
  box-sizing: border-box;
}

.form-textarea:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.form-textarea:disabled {
  background-color: #F5F7FA;
  cursor: not-allowed;
}

.form-help {
  margin-top: 8px;
  font-size: 13px;
  color: #888888;
  line-height: 1.5;
}

/* 버튼 그룹 */
.button-group {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
}

.cancel-btn {
  padding: 14px 32px;
  background: #F5F7FA;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  color: #666666;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover:not(:disabled) {
  background: #E8EAF0;
  border-color: #BDBDBD;
  color: #333333;
}

.cancel-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.submit-btn {
  padding: 14px 32px;
  background: #4CAF50;
  border: none;
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  background: #CCCCCC;
  cursor: not-allowed;
  transform: none;
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
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 400px;
}

.modal-header {
  padding: 24px 28px 16px;
  border-bottom: 1px solid #E0E0E0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #333333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #888888;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: #F8F9FA;
  color: #333333;
}

.modal-body {
  padding: 32px 28px;
  text-align: center;
}

.modal-message {
  font-size: 16px;
  color: #333333;
  line-height: 1.6;
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

.confirm-btn {
  background: #4CAF50;
  border: none;
  color: #FFFFFF;
}

.confirm-btn:hover {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* Diet Plan 선택 */
.select-diet-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #E8F5E9;
  border: 1px solid #4CAF50;
  border-radius: 8px;
  color: #4CAF50;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 16px;
}

.select-diet-btn:hover:not(:disabled) {
  background: #4CAF50;
  color: #FFFFFF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.select-diet-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.selected-diet-card {
  padding: 20px;
  background: #F8F9FA;
  border: 2px solid #4CAF50;
  border-radius: 12px;
  margin-bottom: 12px;
}

.selected-diet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.diet-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.diet-badge {
  padding: 4px 12px;
  background: #4CAF50;
  color: #FFFFFF;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.diet-title {
  font-size: 16px;
  font-weight: 700;
  color: #333333;
}

.remove-diet-btn {
  width: 28px;
  height: 28px;
  background: #F44336;
  border: none;
  border-radius: 50%;
  color: #FFFFFF;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.remove-diet-btn:hover:not(:disabled) {
  background: #D32F2F;
  transform: scale(1.1);
}

.remove-diet-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.diet-date-range {
  font-size: 14px;
  color: #666666;
}

/* Diet Plan 모달 */
.diet-plan-modal {
  max-width: 600px;
}

.modal-loading {
  text-align: center;
  padding: 40px 20px;
  color: #888888;
}

.modal-empty {
  text-align: center;
  padding: 40px 20px;
  color: #888888;
}

.diet-plan-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.diet-plan-card {
  padding: 20px;
  background: #F8F9FA;
  border: 2px solid #E0E0E0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.diet-plan-card:hover {
  border-color: #4CAF50;
  background: #E8F5E9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.diet-plan-card.selected {
  border-color: #4CAF50;
  background: #E8F5E9;
}

.diet-plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.diet-plan-title {
  font-size: 16px;
  font-weight: 700;
  color: #333333;
}

.primary-badge {
  padding: 4px 10px;
  background: #FF9800;
  color: #FFFFFF;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.diet-plan-dates {
  font-size: 14px;
  color: #666666;
  margin-bottom: 8px;
}

.diet-plan-stats {
  font-size: 13px;
  color: #888888;
}

/* 반응형 */
@media (max-width: 968px) {
  .main-content {
    padding: 20px;
  }

  .write-form {
    padding: 24px;
  }

  .button-group {
    flex-direction: column;
  }

  .cancel-btn,
  .submit-btn {
    width: 100%;
  }
}
</style>
