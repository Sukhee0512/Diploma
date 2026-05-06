// app/lib/api.ts
'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/';

export interface ApiResponse {
  resultMessage: string;
  resultCode: number;
  status: number;
  message: string;
  data?: any;
  action?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'gym_manager' | 'admin';
  created_at?: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  gender?: string;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
  };
  gym?: {
    id: number;
    name: string;
    location: string;
    average_rating: number;
  };
}

export interface Reply {
  id: number;
  reply_text: string;
  created_at: string;
  updated_at: string;
  manager?: {
    id: number;
    name: string;
  };
}

export async function apiRequest(action: string, data: any = {}): Promise<ApiResponse> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...data })
    });
    
    if (!response.ok) {
      return {
        status: response.status,
        message: `HTTP ${response.status}: ${response.statusText}`,
        data: null,
        resultCode: response.status,
        resultMessage: response.statusText
      };
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`API Error (${action}):`, error);
    return {
      status: 500,
      message: 'Сервертэй холбогдоход алдаа гарлаа',
      data: null,
      resultCode: 500,
      resultMessage: 'Сервертэй холбогдоход алдаа гарлаа'
    };
  }
}

// ==================== USER SERVICES ====================
export async function login(email: string, password: string) {
  return apiRequest('login', { email, password });
}

export async function register(name: string, email: string, password: string) {
  return apiRequest('register', { name, email, password });
}

export async function changePassword(email: string, old_password: string, new_password: string) {
  return apiRequest('changepassword', { email, old_password, new_password });
}

export async function forgotPassword(email: string) {
  return apiRequest('forgot_password', { email });
}

export async function getUserProfile(userId: number) {
  return apiRequest('get_user_profile', { user_id: userId });
}

export async function updateUserProfile(userId: number, data: {
  name?: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  gender?: string;
}): Promise<ApiResponse> {
  return apiRequest('update_user_profile', { user_id: userId, ...data });
}

// ==================== GYM IMAGE SERVICES ====================
export async function uploadGymImage(gymId: number, file: File): Promise<ApiResponse> {
  const formData = new FormData();
  formData.append('action', 'upload_gym_image');
  formData.append('gym_id', gymId.toString());
  formData.append('image', file);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    console.log('Upload response:', result);
    return result;
  } catch (error) {
    console.error('Upload error:', error);
    return {
      status: 500,
      message: 'Зураг хадгалахад алдаа гарлаа',
      data: null,
      resultCode: 500,
      resultMessage: 'Зураг хадгалахад алдаа гарлаа'
    };
  }
}

export async function deleteGymImage(imageId: number): Promise<ApiResponse> {
  return apiRequest('delete_gym_image', { image_id: imageId });
}

export async function getGymImages(gymId: number): Promise<ApiResponse> {
  return apiRequest('get_gym_images', { gym_id: gymId });
}

export async function getUserStats(userId: number): Promise<ApiResponse> {
  return apiRequest('get_user_stats', { user_id: userId });
}

// ==================== REVIEW & RATING SERVICES ====================
export async function createReview(userId: number, gymId: number, rating: number, comment: string): Promise<ApiResponse> {
  return apiRequest('create_review', { user_id: userId, gym_id: gymId, rating, comment });
}

export async function getGymReviews(gymId: number, page: number = 1, limit: number = 20): Promise<ApiResponse> {
  return apiRequest('get_gym_reviews', { gym_id: gymId, page, limit });
}

export async function getUserReviews(userId: number): Promise<ApiResponse> {
  return apiRequest('get_user_reviews', { user_id: userId });
}

export async function deleteReview(reviewId: number, userId: number): Promise<ApiResponse> {
  return apiRequest('delete_review', { review_id: reviewId, user_id: userId });
}

export async function getTopRatedGyms(limit: number = 10): Promise<ApiResponse> {
  return apiRequest('get_top_rated_gyms', { limit });
}

export async function canUserReview(userId: number, gymId: number): Promise<ApiResponse> {
  return apiRequest('can_user_review', { user_id: userId, gym_id: gymId });
}

// ==================== REPLY TO REVIEW SERVICES ====================
export async function addReplyToReview(reviewId: number, gymManagerId: number, reply: string): Promise<ApiResponse> {
  return apiRequest('add_reply_to_review', { review_id: reviewId, gym_manager_id: gymManagerId, reply });
}

export async function getReviewReplies(reviewId: number): Promise<ApiResponse> {
  return apiRequest('get_review_replies', { review_id: reviewId });
}

export async function deleteReply(replyId: number, gymManagerId: number): Promise<ApiResponse> {
  return apiRequest('delete_reply', { reply_id: replyId, gym_manager_id: gymManagerId });
}

// ==================== ADMIN: USER ROLE MANAGEMENT ====================
export async function updateUserRole(userId: number, role: string) {
  return apiRequest('update_user_role', { user_id: userId, role });
}

export async function getUsersByRole(role?: string) {
  return apiRequest('get_users_by_role', { role: role || '' });
}

export async function getAllUsers() {
  return apiRequest('get_all_users');
}

export async function getGymManagers() {
  return apiRequest('get_gym_managers');
}

export async function getSystemStats(): Promise<ApiResponse> {
  return apiRequest('get_system_stats');
}

export async function getActivityLogs(page: number = 1, limit: number = 50): Promise<ApiResponse> {
  return apiRequest('get_activity_logs', { page, limit });
}

// ==================== ADMIN: GYM MANAGER ASSIGNMENT ====================
export async function assignGymToManager(userId: number, gymId: number) {
  return apiRequest('assign_gym_to_manager', { user_id: userId, gym_id: gymId });
}

export async function getManagerGym(userId: number) {
  return apiRequest('get_manager_gym', { user_id: userId });
}

// ==================== GYM SERVICES ====================
export async function getGyms() {
  return apiRequest('get_gyms');
}

export async function getGymById(gymId: number) {
  return apiRequest('get_gym_by_id', { gym_id: gymId });
}

export async function createGym(name: string, location: string) {
  return apiRequest('create_gym', { name, location });
}

export async function updateGym(gymId: number, name?: string, location?: string) {
  return apiRequest('update_gym', { gym_id: gymId, name, location });
}

export async function deleteGym(gymId: number) {
  return apiRequest('delete_gym', { gym_id: gymId });
}

export async function getGymSchedule(gymId: number, date?: string): Promise<ApiResponse> {
  return apiRequest('get_gym_schedule', { gym_id: gymId, date });
}

// ==================== GYM OWNER SERVICES ====================
export async function getMyGym(userId: number) {
  return apiRequest('get_manager_gym', { user_id: userId });
}

export async function getMyGymCheckins(userId: number, date?: string) {
  return apiRequest('get_my_gym_checkins', { user_id: userId, date });
}

export async function getMyGymStats(userId: number) {
  return apiRequest('get_my_gym_stats', { user_id: userId });
}

// app/lib/api.ts
export async function getGymAttendance(gymManagerId: number, startDate?: string, endDate?: string) {
  return apiRequest('get_gym_attendance', { 
    gym_manager_id: gymManagerId,  // gym_id биш gym_manager_id
    start_date: startDate, 
    end_date: endDate 
  });
}

export async function getAttendanceReport(gymId: number, period: 'daily' | 'weekly' | 'monthly'): Promise<ApiResponse> {
  return apiRequest('get_attendance_report', { gym_id: gymId, period });
}

export async function getGymMembers(gymId: number): Promise<ApiResponse> {
  return apiRequest('get_gym_members', { gym_id: gymId });
}

export async function getGymMemberDetail(gymId: number, userId: number): Promise<ApiResponse> {
  return apiRequest('get_gym_member_detail', { gym_id: gymId, user_id: userId });
}

export async function updateMemberStatus(membershipId: number, status: string): Promise<ApiResponse> {
  return apiRequest('update_member_status', { membership_id: membershipId, status });
}

export async function getGymRevenue(gymId: number, startDate?: string, endDate?: string): Promise<ApiResponse> {
  return apiRequest('get_gym_revenue', { gym_id: gymId, start_date: startDate, end_date: endDate });
}

export async function getRevenueReport(gymId: number, period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<ApiResponse> {
  return apiRequest('get_revenue_report', { gym_id: gymId, period });
}

// ==================== PLAN SERVICES ====================
export async function getAllPlans() {
  return apiRequest('get_all_plans');
}

export async function createPlan(name: string, price: number, duration_days: number) {
  return apiRequest('create_plan', { name, price, duration_days });
}

export async function updatePlan(planId: number, name?: string, price?: number, duration_days?: number) {
  return apiRequest('update_plan', { plan_id: planId, name, price, duration_days });
}

export async function deletePlan(planId: number) {
  return apiRequest('delete_plan', { plan_id: planId });
}

// ==================== PLAN-GYM ASSIGNMENT SERVICES ====================
export async function assignPlanToGym(planId: number, gymId: number) {
  return apiRequest('assign_plan_to_gym', { plan_id: planId, gym_id: gymId });
}

export async function removePlanFromGym(planId: number, gymId: number) {
  return apiRequest('remove_plan_from_gym', { plan_id: planId, gym_id: gymId });
}

export async function getGymPlans(gymId: number) {
  return apiRequest('get_gym_plans', { gym_id: gymId });
}

export async function getPlanGyms(planId: number) {
  return apiRequest('get_plan_gyms', { plan_id: planId });
}

// ==================== MEMBERSHIP SERVICES ====================
export async function createMembership(userId: number, planId: number) {
  return apiRequest('create_membership', { user_id: userId, plan_id: planId });
}

export async function getUserMemberships(userId: number) {
  return apiRequest('get_user_memberships', { user_id: userId });
}

export async function cancelMembership(membershipId: number) {
  return apiRequest('cancel_membership', { membership_id: membershipId });
}

export async function getAllMemberships() {
  return apiRequest('get_all_memberships');
}

// ==================== CHECK-IN SERVICES ====================
export async function createCheckin(userId: number, gymId: number, notes?: string) {
  console.log('createCheckin START', { userId, gymId, notes });
  
  try {
    const result = await apiRequest('create_checkin', { 
      user_id: userId, 
      gym_id: gymId, 
      notes: notes || '' 
    });
    console.log('createCheckin RESULT:', result);
    return result;
  } catch (error) {
    console.error('createCheckin ERROR:', error);
    return {
      resultCode: 500,
      resultMessage: error instanceof Error ? error.message : 'Unknown error',
      status: 500,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getTodayUnverifiedCheckins(gymManagerId: number) {
  return apiRequest('get_today_unverified_checkins', { gym_manager_id: gymManagerId });
}

export async function getAllUnverifiedCheckins(gymManagerId: number, date?: string) {
  return apiRequest('get_all_unverified_checkins', { gym_manager_id: gymManagerId, date });
}

export async function verifyCheckin(checkinId: number, verifiedBy: number) {
  return apiRequest('verify_checkin', { checkin_id: checkinId, verified_by: verifiedBy });
}

export async function getVerifiedCheckinsHistory(gymManagerId: number, page: number = 1, limit: number = 50) {
  return apiRequest('get_verified_checkins_history', { gym_manager_id: gymManagerId, page, limit });
}

export async function getUserCheckins(userId: number) {
  return apiRequest('get_user_checkins', { user_id: userId });
}

export async function getGymCheckins(gymId: number, date?: string) {
  return apiRequest('get_gym_checkins', { gym_id: gymId, date });
}

export async function getGymCheckinStats(gymId: number) {
  return apiRequest('get_gym_checkin_stats', { gym_id: gymId });
}

export async function checkUserAccess(userId: number, gymId: number) {
  return apiRequest('check_user_access', { user_id: userId, gym_id: gymId });
}




// ==================== CHECK-OUT SERVICES ====================
// app/lib/api.ts
export async function createCheckout(userId: number, gymManagerId: number) {
  console.log('createCheckout called:', { userId, gymManagerId });
  const result = await apiRequest('create_checkout', { 
    user_id: userId, 
    gym_manager_id: gymManagerId 
  });
  console.log('createCheckout result:', result);
  return result;
}

export async function getActiveCheckin(userId: number, gymId?: number) {
  return apiRequest('get_active_checkin', { user_id: userId, gym_id: gymId });
}

export async function getGymActiveCheckins(gymManagerId: number) {
  return apiRequest('get_gym_active_checkins', { gym_manager_id: gymManagerId });
}

// ==================== DASHBOARD STATS ====================
export async function getDashboardStats() {
  return apiRequest('get_dashboard_stats');
}

// ==================== FAVORITE GYMS ====================
export async function getFavoriteGyms(userId: number): Promise<ApiResponse> {
  return apiRequest('get_favorite_gyms', { user_id: userId });
}

export async function addFavoriteGym(userId: number, gymId: number): Promise<ApiResponse> {
  return apiRequest('add_favorite_gym', { user_id: userId, gym_id: gymId });
}

export async function removeFavoriteGym(userId: number, gymId: number): Promise<ApiResponse> {
  return apiRequest('remove_favorite_gym', { user_id: userId, gym_id: gymId });
}

// ==================== NOTIFICATIONS ====================
export async function getUserNotifications(userId: number): Promise<ApiResponse> {
  return apiRequest('get_user_notifications', { user_id: userId });
}

export async function markNotificationRead(notificationId: number): Promise<ApiResponse> {
  return apiRequest('mark_notification_read', { notification_id: notificationId });
}

// ==================== CLASS BOOKING ====================
export async function bookClass(classId: number, userId: number): Promise<ApiResponse> {
  return apiRequest('book_class', { class_id: classId, user_id: userId });
}

// ==================== PAYMENT ====================
export async function createPayment(membershipId: number, amount: number, method: string): Promise<ApiResponse> {
  return apiRequest('create_payment', { membership_id: membershipId, amount, method });
}

export async function getPaymentHistory(userId: number): Promise<ApiResponse> {
  return apiRequest('get_payment_history', { user_id: userId });
}

// ==================== COUPON ====================
export async function applyCoupon(code: string, amount: number): Promise<ApiResponse> {
  return apiRequest('apply_coupon', { code, amount });
}

// ==================== UPLOAD ====================
export async function uploadProfileImage(userId: number, file: File): Promise<ApiResponse> {
  const formData = new FormData();
  formData.append('action', 'upload_profile_image');
  formData.append('user_id', userId.toString());
  formData.append('image', file);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Upload error:', error);
    return {
      status: 500,
      message: 'Зураг хадгалахад алдаа гарлаа',
      data: null,
      resultCode: 500,
      resultMessage: 'Зураг хадгалахад алдаа гарлаа'
    };
  }
}

// ==================== EXPORT ====================
export async function exportGymData(gymId: number, format: 'csv' | 'excel', dataType: 'members' | 'attendance' | 'revenue'): Promise<Blob> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'export_gym_data',
      gym_id: gymId,
      format,
      data_type: dataType
    }),
  });
  
  return await response.blob();
}

// ==================== LOCALSTORAGE HELPERS ====================
export function saveUserData(user: User, token?: string) {
  if (typeof window === 'undefined') return;
  
  if (token) localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('userId', user.id.toString());
  localStorage.setItem('userName', user.name);
  localStorage.setItem('userRole', user.role);
  
  try {
    document.cookie = `user=${JSON.stringify(user)}; path=/; max-age=604800`;
  } catch (e) {}
}

export function clearUserData() {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userRole');
  
  try {
    document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  } catch (e) {}
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }
  return null;
}

export function getUserId(): number | null {
  if (typeof window === 'undefined') return null;
  const userId = localStorage.getItem('userId');
  return userId ? parseInt(userId) : null;
}

export function getUserRole(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userRole');
}

export function getUserName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userName');
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('user');
}

export function hasRole(role: 'user' | 'gym_manager' | 'admin'): boolean {
  const userRole = getUserRole();
  return userRole === role;
}

export function isAdmin(): boolean {
  return hasRole('admin');
}

export function isGymManager(): boolean {
  return hasRole('gym_manager');
}

export function isRegularUser(): boolean {
  return hasRole('user');
}

export function getDashboardUrl(): string {
  const user = getCurrentUser();
  if (!user) return '/';
  
  switch (user.role) {
    case 'admin': return '/admin/dashboard';
    case 'gym_manager': return '/gym-owner/dashboard';
    default: return '/dashboard';
  }
}

// ==================== AUTH HELPER FUNCTIONS ====================
export async function loginAndSave(email: string, password: string): Promise<{ success: boolean; message?: string; user?: User }> {
  const response = await login(email, password);
  
  if (response.resultCode === 1002 && response.data && response.data.length > 0) {
    const userData = response.data[0];
    if (!userData.role) userData.role = 'user';
    saveUserData(userData);
    return { success: true, user: userData };
  } else if (response.resultCode === 1004) {
    return { success: false, message: 'Имэйл эсвэл нууц үг буруу байна' };
  } else {
    return { success: false, message: response.resultMessage || 'Нэвтрэхэд алдаа гарлаа' };
  }
}

export async function registerAndSave(name: string, email: string, password: string): Promise<{ success: boolean; message?: string; user?: User }> {
  const response = await register(name, email, password);
  
  if (response.resultCode === 200 && response.data && response.data.length > 0) {
    const userData = response.data[0];
    if (!userData.role) userData.role = 'user';
    saveUserData(userData);
    return { success: true, user: userData };
  } else if (response.resultCode === 3008) {
    return { success: false, message: 'Энэ имэйл хаяг аль хэдийн бүртгэлтэй байна' };
  } else if (response.resultCode === 3007) {
    return { success: false, message: 'Бүх талбарыг бөглөнө үү' };
  } else {
    return { success: false, message: response.resultMessage || 'Бүртгүүлэхэд алдаа гарлаа' };
  }
}

// ==================== RATING & REVIEW HELPER FUNCTIONS ====================
export async function submitReview(userId: number, gymId: number, rating: number, comment: string): Promise<{ success: boolean; message?: string; review?: any }> {
  const response = await createReview(userId, gymId, rating, comment);
  
  if (response.resultCode === 200) {
    return { success: true, review: response.data };
  } else if (response.resultCode === 403) {
    return { success: false, message: response.data?.message || 'Та энэ фитнес төвд сэтгэгдэл бичих эрхгүй байна' };
  } else {
    return { success: false, message: response.resultMessage || 'Сэтгэгдэл хадгалахад алдаа гарлаа' };
  }
}

export async function getGymRatingInfo(gymId: number): Promise<{ averageRating: number; totalReviews: number; ratingDistribution: Record<string, number>; reviews: any[] }> {
  const response = await getGymReviews(gymId);
  
  if (response.resultCode === 200 && response.data) {
    return {
      averageRating: response.data.gym?.average_rating || 0,
      totalReviews: response.data.gym?.total_reviews || 0,
      ratingDistribution: response.data.rating_distribution || {},
      reviews: response.data.reviews || []
    };
  }
  
  return {
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: {},
    reviews: []
  };
}

export async function checkReviewEligibility(userId: number, gymId: number): Promise<{ canReview: boolean; hasReviewed: boolean; existingReview?: any; message: string }> {
  const response = await canUserReview(userId, gymId);
  
  if (response.resultCode === 200 && response.data) {
    return {
      canReview: response.data.can_review,
      hasReviewed: response.data.has_reviewed,
      existingReview: response.data.existing_review,
      message: response.data.message
    };
  }
  
  return {
    canReview: false,
    hasReviewed: false,
    message: 'Сэтгэгдэл бичих боломжийг шалгахад алдаа гарлаа'
  };
}

export async function addGymManagerReply(reviewId: number, gymManagerId: number, replyText: string): Promise<{ success: boolean; message?: string; reply?: any }> {
  const response = await addReplyToReview(reviewId, gymManagerId, replyText);
  
  if (response.resultCode === 200) {
    return { success: true, reply: response.data };
  } else {
    return { success: false, message: response.resultMessage || 'Хариу илгээхэд алдаа гарлаа' };
  }
}