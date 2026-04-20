-- =============================================
-- VedTrim Supabase Schema (PostgreSQL)
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────────────────────────
-- USERS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              serial PRIMARY KEY,
  first_name      varchar(100)  NOT NULL,
  last_name       varchar(100)  NOT NULL,
  email           varchar(255)  NOT NULL UNIQUE,
  phone           varchar(20)   NOT NULL,
  password_hash   varchar(255)  NOT NULL,
  plan            varchar(50)   DEFAULT NULL,
  quiz_completed  boolean       DEFAULT false,
  dob             date          DEFAULT NULL,
  gender          varchar(20)   DEFAULT NULL,
  subscription_end date         DEFAULT NULL,
  created_at      timestamptz   DEFAULT now(),
  updated_at      timestamptz   DEFAULT now()
);

-- ─────────────────────────────────────────────
-- QUIZ DATA TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_data (
  id              serial PRIMARY KEY,
  user_id         int           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  height_cm       numeric(5,2)  DEFAULT NULL,
  weight_kg       numeric(5,2)  DEFAULT NULL,
  goal_weight_kg  numeric(5,2)  DEFAULT NULL,
  gender          varchar(20)   DEFAULT NULL,
  prakriti        varchar(50)   DEFAULT NULL,
  agni            varchar(50)   DEFAULT NULL,
  sleep_quality   varchar(50)   DEFAULT NULL,
  stress_level    varchar(50)   DEFAULT NULL,
  diet_type       varchar(50)   DEFAULT NULL,
  exercise_level  varchar(50)   DEFAULT NULL,
  bmi             numeric(4,1)  DEFAULT NULL,
  raw_data        jsonb         DEFAULT NULL,
  saved_at        timestamptz   DEFAULT now()
);

-- ─────────────────────────────────────────────
-- CONTACT MESSAGES TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id           serial PRIMARY KEY,
  name         varchar(200)  NOT NULL,
  email        varchar(255)  NOT NULL,
  phone        varchar(20)   DEFAULT NULL,
  subject      varchar(255)  DEFAULT NULL,
  message      text          NOT NULL,
  submitted_at timestamptz   DEFAULT now()
);

-- ─────────────────────────────────────────────
-- CONSULT REQUESTS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consult_requests (
  id            serial PRIMARY KEY,
  user_id       int           DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  name          varchar(200)  NOT NULL,
  email         varchar(255)  NOT NULL,
  phone         varchar(20)   DEFAULT NULL,
  concern       text          DEFAULT NULL,
  preferred_time varchar(100) DEFAULT NULL,
  status        varchar(50)   DEFAULT 'pending',
  requested_at  timestamptz   DEFAULT now()
);

-- ─────────────────────────────────────────────
-- SEMINAR BOOKINGS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seminar_bookings (
  id            serial PRIMARY KEY,
  name          varchar(200)  NOT NULL,
  email         varchar(255)  NOT NULL,
  phone         varchar(20)   NOT NULL,
  session_slot  varchar(50)   DEFAULT NULL,
  meet_link     varchar(500)  DEFAULT NULL,
  otp_verified  boolean       DEFAULT false,
  booked_at     timestamptz   DEFAULT now()
);

-- ─────────────────────────────────────────────
-- PRESCRIBED MEDICINES TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prescribed_medicines (
  id              serial PRIMARY KEY,
  user_id         int           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  medicine_name   varchar(200)  NOT NULL,
  dosage          varchar(100)  NOT NULL,
  timing          varchar(200)  NOT NULL,
  duration        varchar(100)  NOT NULL,
  vaidya_name     varchar(200)  DEFAULT 'Dr. Arjun Sharma',
  prescribed_at   timestamptz   DEFAULT now()
);

-- ─────────────────────────────────────────────
-- DAILY WEIGHT TRACKING TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_weights (
  id         serial PRIMARY KEY,
  user_email varchar(255) NOT NULL,
  weight_kg  numeric(5,2) NOT NULL,
  log_date   date         NOT NULL,
  created_at timestamptz  DEFAULT now(),
  UNIQUE (user_email, log_date)
);

-- ─────────────────────────────────────────────
-- PAYMENTS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id             serial PRIMARY KEY,
  user_email     varchar(255)  NOT NULL,
  user_name      varchar(255)  NOT NULL,
  plan           varchar(50)   NOT NULL,
  amount         numeric(10,2) NOT NULL,
  payment_method varchar(50)   NOT NULL,
  transaction_id varchar(100)  DEFAULT NULL,
  user_txn_ref   varchar(100)  DEFAULT NULL,
  status         varchar(20)   DEFAULT 'pending',
  created_at     timestamptz   DEFAULT now()
);

-- ─────────────────────────────────────────────
-- VAIDYA (DOCTOR) TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vaidyas (
  id             serial PRIMARY KEY,
  name           varchar(200)  NOT NULL,
  email          varchar(255)  NOT NULL UNIQUE,
  password_hash  varchar(255)  NOT NULL,
  specialization varchar(200)  DEFAULT 'Weight Management',
  active         boolean       DEFAULT true,
  created_at     timestamptz   DEFAULT now()
);


-- =============================================
-- ROW LEVEL SECURITY — Allow anon access
-- (For hackathon simplicity; tighten for prod)
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE consult_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE seminar_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescribed_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaidyas ENABLE ROW LEVEL SECURITY;

-- Permissive policies for anon role
CREATE POLICY "anon_all_users" ON users FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_quiz" ON quiz_data FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_contact" ON contact_messages FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_consult" ON consult_requests FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_seminar" ON seminar_bookings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_medicines" ON prescribed_medicines FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_weights" ON daily_weights FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_payments" ON payments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_vaidyas" ON vaidyas FOR ALL TO anon USING (true) WITH CHECK (true);


-- =============================================
-- RPC FUNCTIONS (replaces PHP API logic)
-- =============================================

-- ── Register User ──
CREATE OR REPLACE FUNCTION register_user(
  p_first_name text, p_last_name text, p_email text, p_phone text, p_password text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id int;
  v_hash text;
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE email = lower(trim(p_email))) THEN
    RETURN jsonb_build_object('success', false, 'message', 'An account with this email already exists.');
  END IF;

  IF length(p_password) < 6 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Password must be at least 6 characters.');
  END IF;

  v_hash := crypt(p_password, gen_salt('bf'));

  INSERT INTO users (first_name, last_name, email, phone, password_hash)
  VALUES (trim(p_first_name), trim(p_last_name), lower(trim(p_email)), trim(p_phone), v_hash)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_id,
      'firstName', trim(p_first_name),
      'lastName', trim(p_last_name),
      'email', lower(trim(p_email)),
      'phone', trim(p_phone),
      'plan', null,
      'quizCompleted', false,
      'createdAt', now()
    )
  );
END;
$$;

-- ── Login User ──
CREATE OR REPLACE FUNCTION login_user(p_email text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user  record;
  v_quiz  record;
  v_qdata jsonb := null;
BEGIN
  SELECT * INTO v_user FROM users WHERE email = lower(trim(p_email));
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'No account found with this email address.');
  END IF;

  IF v_user.password_hash != crypt(p_password, v_user.password_hash) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Incorrect password. Please try again.');
  END IF;

  SELECT * INTO v_quiz FROM quiz_data WHERE user_id = v_user.id LIMIT 1;
  IF FOUND AND v_quiz.height_cm IS NOT NULL THEN
    v_qdata := jsonb_build_object(
      'height', v_quiz.height_cm, 'weight', v_quiz.weight_kg,
      'goalWeight', v_quiz.goal_weight_kg, 'gender', v_quiz.gender,
      'prakriti', v_quiz.prakriti, 'agni', v_quiz.agni,
      'sleepQuality', v_quiz.sleep_quality, 'stressLevel', v_quiz.stress_level,
      'dietType', v_quiz.diet_type, 'exerciseLevel', v_quiz.exercise_level,
      'bmi', v_quiz.bmi
    );
    IF v_quiz.raw_data IS NOT NULL THEN
      v_qdata := v_qdata || v_quiz.raw_data;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_user.id,
      'firstName', v_user.first_name,
      'lastName', v_user.last_name,
      'email', v_user.email,
      'phone', v_user.phone,
      'plan', v_user.plan,
      'dob', v_user.dob,
      'gender', v_user.gender,
      'subscriptionEnd', v_user.subscription_end,
      'quizCompleted', v_user.quiz_completed,
      'quizData', v_qdata,
      'createdAt', v_user.created_at
    )
  );
END;
$$;

-- ── Get User by Email ──
CREATE OR REPLACE FUNCTION get_user_by_email(p_email text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user  record;
  v_quiz  record;
  v_qdata jsonb := null;
BEGIN
  SELECT * INTO v_user FROM users WHERE email = lower(trim(p_email));
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'User not found.');
  END IF;

  SELECT * INTO v_quiz FROM quiz_data WHERE user_id = v_user.id LIMIT 1;
  IF FOUND AND v_quiz.height_cm IS NOT NULL THEN
    v_qdata := jsonb_build_object(
      'height', v_quiz.height_cm, 'weight', v_quiz.weight_kg,
      'goalWeight', v_quiz.goal_weight_kg, 'gender', v_quiz.gender,
      'prakriti', v_quiz.prakriti, 'agni', v_quiz.agni,
      'sleepQuality', v_quiz.sleep_quality, 'stressLevel', v_quiz.stress_level,
      'dietType', v_quiz.diet_type, 'exerciseLevel', v_quiz.exercise_level,
      'bmi', v_quiz.bmi
    );
    IF v_quiz.raw_data IS NOT NULL THEN
      v_qdata := v_qdata || v_quiz.raw_data;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_user.id,
      'firstName', v_user.first_name,
      'lastName', v_user.last_name,
      'email', v_user.email,
      'phone', v_user.phone,
      'plan', v_user.plan,
      'dob', v_user.dob,
      'gender', v_user.gender,
      'subscriptionEnd', v_user.subscription_end,
      'quizCompleted', v_user.quiz_completed,
      'quizData', v_qdata,
      'createdAt', v_user.created_at
    )
  );
END;
$$;


-- =============================================
-- DEMO DATA
-- =============================================

-- Demo User (password: Demo@123)
INSERT INTO users (first_name, last_name, email, phone, password_hash, plan, quiz_completed)
VALUES (
  'Arya', 'Sharma',
  'demo@vedtrim.com',
  '+91 98765 43210',
  crypt('Demo@123', gen_salt('bf')),
  'premium',
  true
) ON CONFLICT (email) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  plan = EXCLUDED.plan,
  quiz_completed = EXCLUDED.quiz_completed;

-- Demo Quiz Data
INSERT INTO quiz_data (user_id, height_cm, weight_kg, goal_weight_kg, gender, prakriti, agni, sleep_quality, stress_level, diet_type, exercise_level, bmi, raw_data)
SELECT u.id, 168, 82, 70, 'female', 'Kapha-Pitta', 'Mandagni (Slow)', 'Moderate', 'Moderate-High', 'Vegetarian', 'Sedentary',
  round(82.0 / ((1.68)^2), 1),
  '{"dob":"1997-03-15","skin":"Oily, prone to acne","hair":"Thick, slightly oily","sleep":"Moderate","sleepHours":"6-7 hours","wakeUp":"7:00 AM","sleepTime":"11:30 PM","activity":"Sedentary (desk job)","exercise":"Light walks 2-3 times/week","diet":"Vegetarian","meals":"3 meals + 2 snacks","foodChoice":"Home-cooked mostly","lateEating":"Sometimes after 9 PM","foodHabits":"Loves sweets, chai with sugar","stress":"Moderate-High (work pressure)","mentalState":"Anxious at times","motivation":"Want to feel confident and healthy","mindPractice":"Occasional meditation","bp":"Normal (120/80)","heartRate":"76 bpm","pastTreatment":"Tried gym for 3 months, keto diet","dietHistory":"Keto (2 months), Intermittent Fasting (1 month)","weightChange":"Gained 8 kg in last 2 years","conditions1":"Mild thyroid (controlled)","conditions2":"Vitamin D deficiency","digestion":"Irregular, bloating after meals","digestiveIssues":"Acidity, gas after heavy meals","water":"4-5 glasses/day","symptoms":"Fatigue, sugar cravings, joint stiffness","panchakarma":"Never tried","ayurvedicHistory":"Took Triphala once (2 weeks)","foodAllergies":"None","herbAllergy":"None known","medications":"Thyronorm 25mcg daily","priority":"Lose 12 kg in 6 months","reason":"Health + confidence + upcoming wedding","interests":"Yoga, herbal teas, cooking","important":"No crash diets, sustainable approach","city":"Ahmedabad, Gujarat","additionalInfo":"Prefer evening consultation slots. Vegetarian family."}'::jsonb
FROM users u WHERE u.email = 'demo@vedtrim.com'
ON CONFLICT DO NOTHING;

-- Demo Vaidya (password: VedTrim@Vaidya2026)
INSERT INTO vaidyas (name, email, password_hash, specialization)
VALUES (
  'Dr. Arjun Sharma',
  'dr.arjun@vedtrim.com',
  crypt('VedTrim@Vaidya2026', gen_salt('bf')),
  'Ayurvedic Weight Management'
) ON CONFLICT (email) DO NOTHING;

-- Demo weight entries (30 days)
INSERT INTO daily_weights (user_email, weight_kg, log_date) VALUES
  ('demo@vedtrim.com', 82.0, current_date - 30),
  ('demo@vedtrim.com', 81.7, current_date - 29),
  ('demo@vedtrim.com', 81.5, current_date - 28),
  ('demo@vedtrim.com', 81.8, current_date - 27),
  ('demo@vedtrim.com', 81.2, current_date - 26),
  ('demo@vedtrim.com', 81.0, current_date - 25),
  ('demo@vedtrim.com', 80.8, current_date - 24),
  ('demo@vedtrim.com', 81.1, current_date - 23),
  ('demo@vedtrim.com', 80.5, current_date - 22),
  ('demo@vedtrim.com', 80.3, current_date - 21),
  ('demo@vedtrim.com', 80.0, current_date - 20),
  ('demo@vedtrim.com', 80.4, current_date - 19),
  ('demo@vedtrim.com', 79.8, current_date - 18),
  ('demo@vedtrim.com', 79.6, current_date - 17),
  ('demo@vedtrim.com', 79.9, current_date - 16),
  ('demo@vedtrim.com', 79.3, current_date - 15),
  ('demo@vedtrim.com', 79.1, current_date - 14),
  ('demo@vedtrim.com', 79.4, current_date - 13),
  ('demo@vedtrim.com', 78.9, current_date - 12),
  ('demo@vedtrim.com', 78.7, current_date - 11),
  ('demo@vedtrim.com', 79.0, current_date - 10),
  ('demo@vedtrim.com', 78.5, current_date - 9),
  ('demo@vedtrim.com', 78.3, current_date - 8),
  ('demo@vedtrim.com', 78.6, current_date - 7),
  ('demo@vedtrim.com', 78.1, current_date - 6),
  ('demo@vedtrim.com', 78.0, current_date - 5),
  ('demo@vedtrim.com', 78.3, current_date - 4),
  ('demo@vedtrim.com', 78.0, current_date - 3),
  ('demo@vedtrim.com', 77.8, current_date - 2),
  ('demo@vedtrim.com', 77.5, current_date - 1)
ON CONFLICT (user_email, log_date) DO NOTHING;

-- Demo prescribed medicines
INSERT INTO prescribed_medicines (user_id, medicine_name, dosage, timing, duration, vaidya_name)
SELECT u.id, m.name, m.dosage, m.timing, m.duration, 'Dr. Arjun Sharma'
FROM users u,
(VALUES
  ('Triphala Churna', '5g powder', 'Before bed with warm water', '3 months'),
  ('Medohar Guggulu', '2 tablets', 'After breakfast & dinner', '3 months'),
  ('Punarnava Kwath', '15ml decoction', 'Morning empty stomach', '2 months'),
  ('Trikatu Churna', '2g powder', 'Before lunch with honey', '45 days')
) AS m(name, dosage, timing, duration)
WHERE u.email = 'demo@vedtrim.com';

-- Demo consult request
INSERT INTO consult_requests (user_id, name, email, phone, preferred_time, concern)
SELECT u.id, 'Arya Sharma', 'demo@vedtrim.com', '+91 98765 43210', 'Evening (6-8 PM)',
  'I have been struggling with weight gain for 2 years. Tried gym and keto but weight always comes back. Want to try Ayurvedic approach for sustainable weight loss.'
FROM users u WHERE u.email = 'demo@vedtrim.com';
