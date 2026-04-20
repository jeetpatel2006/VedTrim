/* ========================================
   VedTrim — Supabase Database Layer
   Drop-in replacement for the old PHP/MySQL db.js
   Same VedTrimDB interface — zero HTML changes needed
   ======================================== */

const SUPABASE_URL = 'https://fcgdojhbtwbpytxxiusm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjZ2RvamhidHdicHl0eHhpdXNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MTE1NTEsImV4cCI6MjA5MjE4NzU1MX0.g8hdSvPN5sHI2_2zVbOL5MGN9vlFpQk0ETFVZKHkyUI';

const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const VedTrimDB = {

  SESSION_KEY: 'vedtrim_session_user',

  // ──────────────────────────────────────
  // Register new user (calls RPC)
  // ──────────────────────────────────────
  async register(userData) {
    try {
      const { data, error } = await _sb.rpc('register_user', {
        p_first_name: userData.firstName,
        p_last_name: userData.lastName,
        p_email: (userData.email || '').toLowerCase().trim(),
        p_phone: userData.phone,
        p_password: userData.password
      });
      if (error) return { success: false, message: error.message };
      if (data && data.success === false) return data;
      if (data && data.user) return { success: true, user: data.user };
      return data || { success: false, message: 'Registration failed.' };
    } catch (err) {
      console.error('[VedTrimDB] Register error:', err);
      return { success: false, message: 'Could not reach server.' };
    }
  },

  // ──────────────────────────────────────
  // Login (calls RPC)
  // ──────────────────────────────────────
  async login(email, password) {
    try {
      const { data, error } = await _sb.rpc('login_user', {
        p_email: (email || '').toLowerCase().trim(),
        p_password: password
      });
      if (error) return { success: false, message: error.message };
      if (data && data.success === false) return data;
      if (data && data.success && data.user) {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(data.user));
        return { success: true, user: data.user };
      }
      return data || { success: false, message: 'Login failed.' };
    } catch (err) {
      console.error('[VedTrimDB] Login error:', err);
      return { success: false, message: 'Could not reach server.' };
    }
  },

  // ──────────────────────────────────────
  // Logout
  // ──────────────────────────────────────
  logout() {
    localStorage.removeItem(this.SESSION_KEY);
  },

  // ──────────────────────────────────────
  // Get current logged-in user (from session)
  // ──────────────────────────────────────
  getCurrentUser() {
    const data = localStorage.getItem(this.SESSION_KEY);
    return data ? JSON.parse(data) : null;
  },

  // ──────────────────────────────────────
  // Refresh current user data from server
  // ──────────────────────────────────────
  async refreshCurrentUser() {
    const user = this.getCurrentUser();
    if (!user) return null;
    try {
      const { data, error } = await _sb.rpc('get_user_by_email', {
        p_email: user.email
      });
      if (!error && data && data.success && data.user) {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(data.user));
        return data.user;
      }
    } catch (e) { /* fall through */ }
    return user;
  },

  // ──────────────────────────────────────
  // Check if logged in
  // ──────────────────────────────────────
  isLoggedIn() {
    return !!this.getCurrentUser();
  },

  // ──────────────────────────────────────
  // Find user by email (server lookup)
  // ──────────────────────────────────────
  async findByEmail(email) {
    try {
      const { data, error } = await _sb.rpc('get_user_by_email', {
        p_email: (email || '').toLowerCase().trim()
      });
      if (!error && data && data.success) return data.user;
    } catch (e) { /* fall through */ }
    return null;
  },

  // ──────────────────────────────────────
  // Save quiz data
  // ──────────────────────────────────────
  async saveQuizData(email, quizData) {
    try {
      const normalEmail = (email || '').toLowerCase().trim();

      // Get user ID
      const { data: users } = await _sb.from('users').select('id').eq('email', normalEmail).limit(1);
      if (!users || users.length === 0) return false;
      const userId = users[0].id;

      const row = {
        user_id: userId,
        height_cm: quizData.height ? parseFloat(quizData.height) : null,
        weight_kg: quizData.weight ? parseFloat(quizData.weight) : null,
        goal_weight_kg: quizData.goalWeight ? parseFloat(quizData.goalWeight) : null,
        gender: quizData.gender || null,
        prakriti: quizData.prakriti || null,
        agni: quizData.agni || null,
        sleep_quality: quizData.sleepQuality || null,
        stress_level: quizData.stressLevel || null,
        diet_type: quizData.dietType || null,
        exercise_level: quizData.exerciseLevel || null,
        bmi: quizData.bmi ? parseFloat(quizData.bmi) : null,
        raw_data: quizData
      };

      // Check if quiz record exists
      const { data: existing } = await _sb.from('quiz_data').select('id').eq('user_id', userId).limit(1);
      if (existing && existing.length > 0) {
        await _sb.from('quiz_data').update(row).eq('user_id', userId);
      } else {
        await _sb.from('quiz_data').insert(row);
      }

      // Mark quiz completed
      await _sb.from('users').update({ quiz_completed: true }).eq('id', userId);

      // Update local session
      const user = this.getCurrentUser();
      if (user && user.email.toLowerCase() === normalEmail) {
        user.quizCompleted = true;
        user.quizData = quizData;
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
      }
      return true;
    } catch (err) {
      console.error('[VedTrimDB] saveQuizData error:', err);
      return false;
    }
  },

  // ──────────────────────────────────────
  // Save selected plan
  // ──────────────────────────────────────
  async saveSelectedPlan(email, plan) {
    try {
      const normalEmail = (email || '').toLowerCase().trim();
      await _sb.from('users').update({ plan }).eq('email', normalEmail);

      const user = this.getCurrentUser();
      if (user && user.email.toLowerCase() === normalEmail) {
        user.plan = plan;
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
      }
    } catch (e) { /* silent */ }
    return true;
  },

  // ──────────────────────────────────────
  // Save contact message
  // ──────────────────────────────────────
  async saveContact(contactData) {
    try {
      const { error } = await _sb.from('contact_messages').insert({
        name: (contactData.name || '').trim(),
        email: (contactData.email || '').toLowerCase().trim(),
        phone: (contactData.phone || '').trim(),
        subject: (contactData.subject || '').trim(),
        message: (contactData.message || '').trim()
      });
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Message sent successfully! We will contact you soon.' };
    } catch (err) {
      return { success: false, message: 'Could not reach server.' };
    }
  },

  // ──────────────────────────────────────
  // Save consult request
  // ──────────────────────────────────────
  async saveConsult(consultData) {
    try {
      const normalEmail = (consultData.email || '').toLowerCase().trim();

      // Optional: link to user account
      let userId = null;
      const { data: users } = await _sb.from('users').select('id').eq('email', normalEmail).limit(1);
      if (users && users.length > 0) userId = users[0].id;

      const { error } = await _sb.from('consult_requests').insert({
        user_id: userId,
        name: (consultData.name || '').trim(),
        email: normalEmail,
        phone: (consultData.phone || '').trim(),
        concern: (consultData.concern || '').trim(),
        preferred_time: (consultData.preferredTime || '').trim()
      });
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Consultation request submitted! Our Vaidya will reach out within 24 hours.' };
    } catch (err) {
      return { success: false, message: 'Could not reach server.' };
    }
  },

  // ──────────────────────────────────────
  // Update user data
  // ──────────────────────────────────────
  async updateUser(email, updates) {
    try {
      const normalEmail = (email || '').toLowerCase().trim();
      const allowedMap = {
        plan: 'plan', firstName: 'first_name', lastName: 'last_name',
        phone: 'phone', dob: 'dob', gender: 'gender',
        subscription_end: 'subscription_end', quiz_completed: 'quiz_completed'
      };

      const dbUpdates = {};
      for (const [inputKey, dbCol] of Object.entries(allowedMap)) {
        if (updates[inputKey] !== undefined) dbUpdates[dbCol] = updates[inputKey];
      }

      if (Object.keys(dbUpdates).length > 0) {
        await _sb.from('users').update(dbUpdates).eq('email', normalEmail);
      }

      // Refresh session
      const user = this.getCurrentUser();
      if (user && user.email.toLowerCase() === normalEmail) {
        const updated = { ...user, ...updates };
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(updated));
      }
      return true;
    } catch (err) {
      console.error('[VedTrimDB] updateUser error:', err);
      return true;
    }
  },

  // ──────────────────────────────────────
  // Save seminar booking
  // ──────────────────────────────────────
  async saveSeminar(data) {
    try {
      const meetLink = 'https://meet.google.com/vedtrim-seminar-' + Math.random().toString(36).substring(2, 11);
      const { data: result, error } = await _sb.from('seminar_bookings').insert({
        name: (data.name || '').trim(),
        email: (data.email || '').toLowerCase().trim(),
        phone: (data.phone || '').trim(),
        session_slot: data.session || null,
        meet_link: meetLink,
        otp_verified: true
      }).select().single();

      if (error) return { success: false, message: error.message };
      return {
        success: true,
        message: 'Seminar booked successfully!',
        booking: { id: result.id, name: result.name, email: result.email, session: result.session_slot, meetLink }
      };
    } catch (err) {
      return { success: false, message: 'Could not reach server.' };
    }
  },

  // ──────────────────────────────────────
  // Process payment
  // ──────────────────────────────────────
  async processPayment(payData) {
    try {
      const normalEmail = (payData.email || '').toLowerCase().trim();
      const amount = payData.plan === 'premium' ? 5999.00 : 3499.00;
      const txnId = 'VT' + Math.random().toString(36).substring(2, 12).toUpperCase();
      const subEnd = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

      // Get user_id from users table (single source)
      const { data: users } = await _sb.from('users').select('id').eq('email', normalEmail).limit(1);
      const userId = users && users[0] ? users[0].id : null;

      await _sb.from('payments').insert({
        user_id: userId,
        user_email: normalEmail,
        user_name: payData.name,
        plan: payData.plan,
        amount: amount,
        payment_method: payData.method,
        transaction_id: txnId,
        user_txn_ref: payData.txnId || null,
        status: 'confirmed'
      });

      // Update user plan + subscription end (single source of truth)
      if (userId) {
        await _sb.from('users').update({ plan: payData.plan, subscription_end: subEnd }).eq('id', userId);
      }

      return {
        success: true,
        message: 'Payment processed successfully!',
        transactionId: txnId,
        amount: amount,
        plan: payData.plan,
        subscriptionEnd: subEnd
      };
    } catch (err) {
      console.error('[VedTrimDB] processPayment error:', err);
      return { success: false, message: 'Payment processing failed.' };
    }
  },

  // ──────────────────────────────────────
  // Daily weight — get history
  // ──────────────────────────────────────
  async getDailyWeights(email) {
    try {
      // Look up user_id first (single source)
      const { data: users } = await _sb.from('users').select('id').eq('email', email).limit(1);
      if (!users || users.length === 0) return { success: false, weights: [], loggedToday: false, todayWeight: null };
      const userId = users[0].id;

      const { data: weights, error } = await _sb.from('daily_weights')
        .select('weight_kg, log_date')
        .eq('user_id', userId)
        .order('log_date', { ascending: true });

      if (error) return { success: false, weights: [], loggedToday: false, todayWeight: null };

      const today = new Date().toISOString().split('T')[0];
      const todayEntry = (weights || []).find(w => w.log_date === today);

      return {
        success: true,
        weights: weights || [],
        loggedToday: !!todayEntry,
        todayWeight: todayEntry ? todayEntry.weight_kg : null
      };
    } catch (err) {
      return { success: false, weights: [], loggedToday: false, todayWeight: null };
    }
  },

  // ──────────────────────────────────────
  // Daily weight — log today
  // ──────────────────────────────────────
  async logDailyWeight(email, weight) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const w = parseFloat(weight);
      if (w < 20 || w > 300) return { success: false, message: 'Please enter a valid weight (20-300 kg).' };

      // Look up user_id (single source)
      const { data: users } = await _sb.from('users').select('id').eq('email', email).limit(1);
      if (!users || users.length === 0) return { success: false, message: 'User not found.' };
      const userId = users[0].id;

      const { error } = await _sb.from('daily_weights').upsert({
        user_id: userId,
        user_email: email,
        weight_kg: w,
        log_date: today
      }, { onConflict: 'user_email,log_date' });

      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Weight logged successfully!', date: today, weight: w };
    } catch (err) {
      return { success: false, message: 'Could not reach server.' };
    }
  },

  // ──────────────────────────────────────
  // Get prescribed medicines for a user
  // ──────────────────────────────────────
  async getMedicines(email) {
    try {
      const { data: users } = await _sb.from('users').select('id').eq('email', email).limit(1);
      if (!users || users.length === 0) return { success: false, medicines: [] };

      const { data: medicines, error } = await _sb.from('prescribed_medicines')
        .select('*')
        .eq('user_id', users[0].id)
        .order('prescribed_at', { ascending: false });

      if (error) return { success: false, medicines: [] };
      return { success: true, medicines: medicines || [] };
    } catch (err) {
      return { success: false, medicines: [] };
    }
  },

  // ──────────────────────────────────────
  // Prescribe medicine (Vaidya)
  // ──────────────────────────────────────
  async prescribeMedicine(data) {
    try {
      const { data: users } = await _sb.from('users').select('id').eq('email', data.user_email).limit(1);
      if (!users || users.length === 0) return { success: false, message: 'User not found.' };

      // vaidya_id FK — resolve name from vaidyas table
      const vaidyaId = data.vaidya_id || 1;
      const { data: vRows } = await _sb.from('vaidyas').select('name').eq('id', vaidyaId).limit(1);
      const vaidyaName = vRows && vRows[0] ? vRows[0].name : 'Unknown';

      const { data: med, error } = await _sb.from('prescribed_medicines').insert({
        user_id: users[0].id,
        medicine_name: data.medicine_name,
        dosage: data.dosage,
        timing: data.timing,
        duration: data.duration,
        vaidya_id: vaidyaId,
        vaidya_name: vaidyaName
      }).select().single();

      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Medicine prescribed successfully!', medicine: med };
    } catch (err) {
      return { success: false, message: 'Could not reach server.' };
    }
  },

  // ──────────────────────────────────────
  // Delete prescribed medicine
  // ──────────────────────────────────────
  async deleteMedicine(id) {
    try {
      const { error } = await _sb.from('prescribed_medicines').delete().eq('id', id);
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Medicine removed successfully.' };
    } catch (err) {
      return { success: false, message: 'Could not reach server.' };
    }
  },

  // ──────────────────────────────────────
  // Get all users (Vaidya dashboard)
  // ──────────────────────────────────────
  async getAllUsers(vaidyaKey, vaidyaId) {
    try {
      // Fetch users — optionally filter by assigned vaidya
      let query = _sb.from('users')
        .select('id, first_name, last_name, email, phone, plan, quiz_completed, created_at, dob, gender, subscription_end, assigned_vaidya_id')
        .order('created_at', { ascending: false });

      if (vaidyaId) {
        query = query.eq('assigned_vaidya_id', vaidyaId);
      }

      const { data: userRows, error } = await query;
      if (error) return { success: false, message: error.message };

      const users = [];
      for (const row of (userRows || [])) {
        // Get quiz data
        let quizData = null;
        const { data: qRows } = await _sb.from('quiz_data')
          .select('*').eq('user_id', row.id).limit(1);

        if (qRows && qRows.length > 0 && qRows[0].height_cm) {
          const q = qRows[0];
          quizData = {
            height: q.height_cm, weight: q.weight_kg, goalWeight: q.goal_weight_kg,
            gender: q.gender, prakriti: q.prakriti, agni: q.agni,
            sleepQuality: q.sleep_quality, stressLevel: q.stress_level,
            dietType: q.diet_type, exerciseLevel: q.exercise_level, bmi: q.bmi
          };
          if (q.raw_data) quizData = { ...quizData, ...q.raw_data };
        }

      // Get daily weights via user_id
      const { data: wRows } = await _sb.from('daily_weights')
        .select('weight_kg, log_date')
        .eq('user_id', row.id)
        .order('log_date', { ascending: true });

        users.push({
          id: row.id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          phone: row.phone,
          plan: row.plan,
          quizCompleted: row.quiz_completed,
          quizData: quizData,
          createdAt: row.created_at,
          dob: row.dob,
          gender: row.gender,
          subscriptionEnd: row.subscription_end,
          assignedVaidyaId: row.assigned_vaidya_id,
          dailyWeights: (wRows || []).map(w => ({ weight: w.weight_kg, date: w.log_date }))
        });
      }

      return { success: true, users, total: users.length };
    } catch (err) {
      console.error('[VedTrimDB] getAllUsers error:', err);
      return { success: false, message: 'Server error.' };
    }
  },

  // ──────────────────────────────────────
  // Vaidya login
  // ──────────────────────────────────────
  async vaidyaLogin(password) {
    try {
      const { data: vaidyas } = await _sb.from('vaidyas').select('*').eq('password_hash', password).eq('active', true);
      if (vaidyas && vaidyas.length > 0) {
        const v = vaidyas[0];
        return {
          success: true,
          vaidya: {
            id: v.id, name: v.name, email: v.email,
            specialization: v.specialization,
            loginAt: new Date().toISOString()
          }
        };
      }
      return { success: false, message: 'Invalid credentials. Access denied.' };
    } catch (err) {
      return { success: false, message: 'Server error.' };
    }
  },

  // ──────────────────────────────────────
  // Utility: Calculate BMI
  // ──────────────────────────────────────
  calculateBMI(weightKg, heightCm) {
    const heightM = heightCm / 100;
    return (weightKg / (heightM * heightM)).toFixed(1);
  },

  // ──────────────────────────────────────
  // Utility: Get BMI Category
  // ──────────────────────────────────────
  getBMICategory(bmi) {
    if (bmi < 18.5) return { label: 'Underweight', color: '#3498DB' };
    if (bmi < 25)   return { label: 'Normal',      color: '#27AE60' };
    if (bmi < 30)   return { label: 'Overweight',  color: '#F39C12' };
    return               { label: 'Obese',        color: '#E74C3C' };
  },

  // ──────────────────────────────────────
  // Legacy init() — kept for compatibility
  // ──────────────────────────────────────
  init() {
    // No action needed — Supabase client is initialized above
  },

  // ──────────────────────────────────────
  // Get visible reviews
  // ──────────────────────────────────────
  async getReviews() {
    try {
      const { data, error } = await _sb.from('reviews')
        .select('*')
        .eq('is_visible', true)
        .order('created_at', { ascending: false });
      if (error) return { success: false, reviews: [] };
      return { success: true, reviews: data || [] };
    } catch (err) {
      return { success: false, reviews: [] };
    }
  },

  // ──────────────────────────────────────
  // Submit a review
  // ──────────────────────────────────────
  async submitReview(reviewData) {
    try {
      const { error } = await _sb.from('reviews').insert({
        user_email: reviewData.email,
        user_name: reviewData.name,
        rating: reviewData.rating || 5,
        review_text: reviewData.text
      });
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Review submitted successfully! Thank you! 🌿' };
    } catch (err) {
      return { success: false, message: 'Could not submit review.' };
    }
  }
};

// Keep backward compat
VedTrimDB.init();
