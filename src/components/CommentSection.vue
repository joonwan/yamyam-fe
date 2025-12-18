<script setup>
import { ref, computed } from 'vue'
import { commentApi } from '@/api'

const props = defineProps({
  postId: {
    type: Number,
    required: true
  },
  comments: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['refresh'])

// 현재 로그인한 사용자 닉네임
const currentUserNickname = ref(localStorage.getItem('nickname') || '')

// 댓글 입력
const newComment = ref('')
const isSubmitting = ref(false)

// 댓글 수정 상태
const editingCommentId = ref(null)
const editContent = ref('')

// 댓글 삭제 확인 모달
const deletingCommentId = ref(null)

// 날짜 포맷팅
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 댓글 작성자 확인
const isCommentAuthor = (comment) => {
  return comment.author.nickname === currentUserNickname.value
}

// 댓글 등록
const submitComment = async () => {
  if (!newComment.value.trim()) {
    alert('댓글 내용을 입력해주세요.')
    return
  }

  try {
    isSubmitting.value = true
    await commentApi.createComment(props.postId, {
      content: newComment.value.trim()
    })
    newComment.value = ''
    emit('refresh')
  } catch (error) {
    console.error('댓글 등록 실패:', error)
    if (error.response?.data?.message) {
      alert(error.response.data.message)
    } else {
      alert('댓글 등록에 실패했습니다.')
    }
  } finally {
    isSubmitting.value = false
  }
}

// 댓글 수정 시작
const startEdit = (comment) => {
  editingCommentId.value = comment.commentId
  editContent.value = comment.content
}

// 댓글 수정 취소
const cancelEdit = () => {
  editingCommentId.value = null
  editContent.value = ''
}

// 댓글 수정 저장
const saveEdit = async (commentId) => {
  if (!editContent.value.trim()) {
    alert('댓글 내용을 입력해주세요.')
    return
  }

  try {
    await commentApi.updateComment(props.postId, commentId, {
      newContent: editContent.value.trim()
    })
    editingCommentId.value = null
    editContent.value = ''
    emit('refresh')
  } catch (error) {
    console.error('댓글 수정 실패:', error)
    if (error.response?.data?.message) {
      alert(error.response.data.message)
    } else {
      alert('댓글 수정에 실패했습니다.')
    }
  }
}

// 댓글 삭제 확인
const confirmDelete = (commentId) => {
  deletingCommentId.value = commentId
}

// 댓글 삭제
const deleteComment = async (commentId) => {
  try {
    await commentApi.deleteComment(props.postId, commentId)
    deletingCommentId.value = null
    emit('refresh')
  } catch (error) {
    console.error('댓글 삭제 실패:', error)
    if (error.response?.data?.message) {
      alert(error.response.data.message)
    } else {
      alert('댓글 삭제에 실패했습니다.')
    }
  }
}

// 댓글 삭제 취소
const cancelDelete = () => {
  deletingCommentId.value = null
}
</script>

<template>
  <div class="comments-section">
    <h3 class="comments-title">댓글 {{ comments.length }}</h3>

    <!-- 댓글 입력 -->
    <div class="comment-input-box">
      <input
        v-model="newComment"
        type="text"
        placeholder="댓글을 입력하세요..."
        class="comment-input"
        @keyup.enter="submitComment"
        :disabled="isSubmitting"
      />
      <button
        class="comment-submit-btn"
        @click="submitComment"
        :disabled="isSubmitting || !newComment.trim()"
      >
        {{ isSubmitting ? '작성 중...' : '작성' }}
      </button>
    </div>

    <!-- 댓글 목록 -->
    <div v-if="comments.length > 0" class="comments-list">
      <div
        v-for="comment in comments"
        :key="comment.commentId"
        class="comment-item"
      >
        <!-- 수정 모드가 아닐 때 -->
        <template v-if="editingCommentId !== comment.commentId">
          <div class="comment-header">
            <div class="comment-author-info">
              <span class="comment-author">{{ comment.author.nickname }}</span>
              <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
            </div>
            <div v-if="isCommentAuthor(comment)" class="comment-actions">
              <button
                class="comment-action-btn edit-btn"
                @click="startEdit(comment)"
              >
                수정
              </button>
              <button
                class="comment-action-btn delete-btn"
                @click="confirmDelete(comment.commentId)"
              >
                삭제
              </button>
            </div>
          </div>
          <p class="comment-text">{{ comment.content }}</p>
        </template>

        <!-- 수정 모드일 때 -->
        <template v-else>
          <div class="comment-edit-box">
            <input
              v-model="editContent"
              type="text"
              class="comment-edit-input"
              @keyup.enter="saveEdit(comment.commentId)"
            />
            <div class="comment-edit-actions">
              <button
                class="comment-edit-save-btn"
                @click="saveEdit(comment.commentId)"
              >
                저장
              </button>
              <button
                class="comment-edit-cancel-btn"
                @click="cancelEdit"
              >
                취소
              </button>
            </div>
          </div>
        </template>

        <!-- 삭제 확인 모달 -->
        <div
          v-if="deletingCommentId === comment.commentId"
          class="delete-confirm-overlay"
          @click="cancelDelete"
        >
          <div class="delete-confirm-box" @click.stop>
            <p class="delete-confirm-text">댓글을 삭제하시겠습니까?</p>
            <div class="delete-confirm-actions">
              <button
                class="delete-confirm-btn cancel"
                @click="cancelDelete"
              >
                취소
              </button>
              <button
                class="delete-confirm-btn confirm"
                @click="deleteComment(comment.commentId)"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 댓글 없을 때 -->
    <div v-else class="comments-empty">
      <p class="empty-text">아직 댓글이 없습니다. 첫 댓글을 작성해보세요!</p>
    </div>
  </div>
</template>

<style scoped>
.comments-section {
  border-top: 2px solid #F0F0F0;
  padding-top: 24px;
  margin-top: 32px;
}

.comments-title {
  font-size: 18px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 16px;
}

/* 댓글 입력 */
.comment-input-box {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.comment-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 14px;
  background-color: #FFFFFF;
  color: #333333;
  outline: none;
  transition: border-color 0.3s ease;
}

.comment-input:focus {
  border-color: #4CAF50;
}

.comment-input:disabled {
  background-color: #F5F7FA;
  cursor: not-allowed;
}

.comment-submit-btn {
  padding: 12px 24px;
  background: #4CAF50;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
  white-space: nowrap;
}

.comment-submit-btn:hover:not(:disabled) {
  background: #45A049;
}

.comment-submit-btn:disabled {
  background: #CCCCCC;
  cursor: not-allowed;
}

/* 댓글 목록 */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  padding: 16px;
  background: #F8F9FA;
  border-radius: 8px;
  position: relative;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.comment-author {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
}

.comment-date {
  font-size: 12px;
  color: #888888;
}

.comment-actions {
  display: flex;
  gap: 8px;
}

.comment-action-btn {
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
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

.comment-text {
  font-size: 14px;
  color: #666666;
  line-height: 1.6;
  word-break: break-word;
}

/* 댓글 수정 */
.comment-edit-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-edit-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #4CAF50;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.comment-edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.comment-edit-save-btn,
.comment-edit-cancel-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.comment-edit-save-btn {
  background: #4CAF50;
  color: #FFFFFF;
}

.comment-edit-save-btn:hover {
  background: #45A049;
}

.comment-edit-cancel-btn {
  background: #F5F7FA;
  color: #666666;
  border: 1px solid #E0E0E0;
}

.comment-edit-cancel-btn:hover {
  background: #E8EAF0;
}

/* 삭제 확인 모달 */
.delete-confirm-overlay {
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

.delete-confirm-box {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.delete-confirm-text {
  font-size: 16px;
  color: #333333;
  text-align: center;
  margin-bottom: 20px;
}

.delete-confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.delete-confirm-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.delete-confirm-btn.cancel {
  background: #F5F7FA;
  color: #666666;
  border: 1px solid #E0E0E0;
}

.delete-confirm-btn.cancel:hover {
  background: #E8EAF0;
}

.delete-confirm-btn.confirm {
  background: #F44336;
  color: #FFFFFF;
}

.delete-confirm-btn.confirm:hover {
  background: #D32F2F;
}

/* 빈 상태 */
.comments-empty {
  text-align: center;
  padding: 40px 20px;
}

.empty-text {
  font-size: 14px;
  color: #AAAAAA;
  font-style: italic;
}
</style>
