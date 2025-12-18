<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import CommentSection from '@/components/CommentSection.vue'
import { postApi } from '@/api'

const router = useRouter()
const route = useRoute()

// 현재 로그인한 사용자 닉네임
const currentUserNickname = ref(localStorage.getItem('nickname') || '')

// 게시글 데이터
const post = ref(null)
const loading = ref(false)
const error = ref(null)

// 좋아요 처리 중 상태
const isLiking = ref(false)

// 삭제 확인 모달
const showDeleteModal = ref(false)

// 게시글 ID
const postId = computed(() => parseInt(route.params.id))

// 게시글 작성자 확인
const isAuthor = computed(() => {
  return post.value?.author.nickname === currentUserNickname.value
})

// 날짜 포맷팅
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 게시글 상세 조회
const fetchPost = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await postApi.getPost(postId.value)
    post.value = data
  } catch (err) {
    console.error('게시글 조회 실패:', err)
    if (err.response?.status === 404) {
      error.value = '게시글을 찾을 수 없습니다.'
    } else {
      error.value = '게시글을 불러오는데 실패했습니다.'
    }
  } finally {
    loading.value = false
  }
}

// 좋아요 토글
const toggleLike = async () => {
  if (isLiking.value || !post.value) return

  try {
    isLiking.value = true

    if (post.value.isLiked) {
      await postApi.unlikePost(postId.value)
      post.value.isLiked = false
      post.value.likeCount--
    } else {
      await postApi.likePost(postId.value)
      post.value.isLiked = true
      post.value.likeCount++
    }
  } catch (err) {
    console.error('좋아요 처리 실패:', err)
    alert('좋아요 처리에 실패했습니다.')
  } finally {
    isLiking.value = false
  }
}

// 게시글 수정
const editPost = () => {
  router.push(`/board/edit/${postId.value}`)
}

// 게시글 삭제 확인
const confirmDelete = () => {
  showDeleteModal.value = true
}

// 게시글 삭제
const deletePost = async () => {
  try {
    await postApi.deletePost(postId.value)
    alert('게시글이 삭제되었습니다.')
    router.push('/board')
  } catch (err) {
    console.error('게시글 삭제 실패:', err)
    if (err.response?.data?.message) {
      alert(err.response.data.message)
    } else {
      alert('게시글 삭제에 실패했습니다.')
    }
  }
}

// 목록으로 돌아가기
const goBack = () => {
  router.push('/board')
}

// 식단 계획 상세로 이동
const goToDietPlan = (dietPlanId) => {
  router.push({
    name: 'diet-plan-detail',
    query: { id: dietPlanId }
  })
}

onMounted(() => {
  fetchPost()
})
</script>

<template>
  <div class="detail-container">
    <!-- 상단 네비게이션 -->
    <AppHeader active-page="board" />

    <!-- 메인 콘텐츠 -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- 뒤로가기 버튼 -->
        <button @click="goBack" class="back-btn">
          ← 목록으로
        </button>

        <!-- 로딩 상태 -->
        <div v-if="loading" class="loading-container">
          <p class="loading-text">게시글을 불러오는 중...</p>
        </div>

        <!-- 에러 상태 -->
        <div v-else-if="error" class="error-container">
          <p class="error-text">{{ error }}</p>
          <button class="retry-btn" @click="fetchPost">다시 시도</button>
          <button class="back-list-btn" @click="goBack">목록으로</button>
        </div>

        <!-- 게시글 상세 -->
        <article v-else-if="post" class="post-detail">
          <div class="post-header">
            <h1 class="post-title">{{ post.title }}</h1>
            <div class="post-meta">
              <div class="post-author-info">
                <span class="post-author">{{ post.author.nickname }}</span>
                <span class="post-date">{{ formatDate(post.createdAt) }}</span>
              </div>
              <div v-if="isAuthor" class="post-actions">
                <button class="action-btn edit-btn" @click="editPost">
                  수정
                </button>
                <button class="action-btn delete-btn" @click="confirmDelete">
                  삭제
                </button>
              </div>
            </div>
          </div>

          <div class="post-content">
            <p class="content-text">{{ post.content }}</p>
          </div>

          <!-- 식단 표시 -->
          <div
            v-if="post.dietPlan"
            class="post-diet-section"
            @click="goToDietPlan(post.dietPlan.dietPlanId)"
          >
            <div class="diet-header">
              <span class="diet-badge">식단 포함</span>
              <span class="diet-date">
                {{ post.dietPlan.startDate }} ~ {{ post.dietPlan.endDate }}
              </span>
            </div>
            <div class="diet-title">{{ post.dietPlan.title }}</div>
            <div class="diet-click-hint">클릭하여 식단 상세 보기</div>
          </div>

          <!-- 좋아요 버튼 -->
          <div class="like-section">
            <button
              class="like-btn"
              :class="{ liked: post.isLiked }"
              @click="toggleLike"
              :disabled="isLiking"
            >
              <span class="like-icon">{{ post.isLiked ? '❤️' : '🤍' }}</span>
              <span class="like-text">좋아요 {{ post.likeCount }}</span>
            </button>
          </div>

          <!-- 댓글 섹션 -->
          <CommentSection
            :post-id="postId"
            :comments="post.comments"
            @refresh="fetchPost"
          />
        </article>
      </div>
    </main>

    <!-- 삭제 확인 모달 -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">게시글 삭제</h2>
          <button class="modal-close" @click="showDeleteModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-message">게시글을 삭제하시겠습니까?<br/>삭제된 게시글은 복구할 수 없습니다.</p>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel-btn" @click="showDeleteModal = false">취소</button>
          <button class="modal-btn confirm-btn" @click="deletePost">삭제</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-container {
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

.back-btn {
  padding: 10px 20px;
  background: #F5F7FA;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  color: #666666;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 24px;
}

.back-btn:hover {
  background: #E8EAF0;
  border-color: #BDBDBD;
  color: #333333;
}

/* 로딩 및 에러 */
.loading-container,
.error-container {
  text-align: center;
  padding: 80px 20px;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.loading-text,
.error-text {
  font-size: 16px;
  color: #888888;
  margin-bottom: 20px;
}

.retry-btn,
.back-list-btn {
  padding: 12px 24px;
  background: #4CAF50;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0 8px;
}

.retry-btn:hover,
.back-list-btn:hover {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.back-list-btn {
  background: #F5F7FA;
  color: #666666;
  border: 1px solid #E0E0E0;
}

.back-list-btn:hover {
  background: #E8EAF0;
  border-color: #BDBDBD;
  color: #333333;
  box-shadow: none;
}

/* 게시글 상세 */
.post-detail {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.post-header {
  border-bottom: 2px solid #E0E0E0;
  padding-bottom: 24px;
  margin-bottom: 32px;
}

.post-title {
  font-size: 32px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 16px;
  line-height: 1.4;
  word-break: break-word;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-author-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.post-author {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
}

.post-date {
  font-size: 15px;
  color: #888888;
}

.post-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-btn {
  background: #E8F5E9;
  color: #4CAF50;
}

.edit-btn:hover {
  background: #C8E6C9;
}

.delete-btn {
  background: #FFEBEE;
  color: #F44336;
}

.delete-btn:hover {
  background: #FFCDD2;
}

.post-content {
  margin-bottom: 32px;
}

.content-text {
  font-size: 17px;
  color: #333333;
  line-height: 1.9;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 식단 섹션 */
.post-diet-section {
  padding: 24px;
  background: #F8F9FA;
  border: 2px solid #4CAF50;
  border-radius: 12px;
  margin-bottom: 32px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.post-diet-section:hover {
  background: #E8F5E9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.diet-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.diet-badge {
  padding: 6px 14px;
  background: #4CAF50;
  color: #FFFFFF;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
}

.diet-date {
  font-size: 14px;
  font-weight: 600;
  color: #666666;
}

.diet-title {
  font-size: 16px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 8px;
}

.diet-click-hint {
  font-size: 13px;
  color: #4CAF50;
  font-weight: 600;
}

/* 좋아요 섹션 */
.like-section {
  display: flex;
  justify-content: center;
  padding: 24px 0;
  border-bottom: 2px solid #F0F0F0;
  margin-bottom: 32px;
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 32px;
  background: #F5F7FA;
  border: 2px solid #E0E0E0;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
  color: #666666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.like-btn:hover:not(:disabled) {
  border-color: #FF4081;
  background: #FFE5EF;
  color: #FF4081;
  transform: translateY(-2px);
}

.like-btn.liked {
  border-color: #FF4081;
  background: #FFE5EF;
  color: #FF4081;
}

.like-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.like-icon {
  font-size: 20px;
}

.like-text {
  font-size: 16px;
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

.cancel-btn {
  background: #F5F7FA;
  border: 1px solid #E0E0E0;
  color: #666666;
}

.cancel-btn:hover {
  background: #E8EAF0;
  border-color: #BDBDBD;
  color: #333333;
}

.confirm-btn {
  background: #F44336;
  border: none;
  color: #FFFFFF;
}

.confirm-btn:hover {
  background: #D32F2F;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
}

/* 반응형 */
@media (max-width: 968px) {
  .main-content {
    padding: 20px;
  }

  .post-detail {
    padding: 24px;
  }

  .post-title {
    font-size: 24px;
  }

  .post-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
