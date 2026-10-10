-- ═══════════════════════════════════════════════════════════════════════════════
-- 🏫 SCHOOL MANAGEMENT SYSTEM - RELATIONAL DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════════
-- Compatible with: PostgreSQL (14+) & MySQL (8.0+)
-- Supports: Students, Teachers, Classes, Sections, Attendance, Exams, Marks, Fees, Testimonials

-- 1. SCHOOL INFORMATION & SETTINGS
CREATE TABLE IF NOT EXISTS school_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    school_name VARCHAR(255) NOT NULL DEFAULT 'বরইতলী উচ্চ বিদ্যালয়',
    school_name_en VARCHAR(255) DEFAULT 'Boraitoli High School',
    eiin VARCHAR(50) NOT NULL DEFAULT '106184',
    estd_year VARCHAR(10) DEFAULT '1969',
    school_logo TEXT,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(100),
    website VARCHAR(150),
    principal_name VARCHAR(150),
    principal_title VARCHAR(100) DEFAULT 'প্রধান শিক্ষক',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ACADEMIC SESSIONS
CREATE TABLE IF NOT EXISTS academic_sessions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_bn VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    admission_status VARCHAR(20) DEFAULT 'Open', -- Open, Closed, Upcoming
    status VARCHAR(20) DEFAULT 'Active',        -- Active, Archived, Upcoming
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. CLASSES & SECTIONS
CREATE TABLE IF NOT EXISTS classes (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_bn VARCHAR(100) NOT NULL,
    grade_number INT NOT NULL, -- 6, 7, 8, 9, 10
    class_teacher_id VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS class_sections (
    id VARCHAR(50) PRIMARY KEY,
    class_id VARCHAR(50) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    section_name VARCHAR(50) NOT NULL, -- A, B, C / পদ্মা, মেঘনা
    room_number VARCHAR(50),
    capacity INT DEFAULT 60,
    section_teacher_id VARCHAR(50)
);

-- 4. TEACHERS & STAFF
CREATE TABLE IF NOT EXISTS teachers (
    id VARCHAR(50) PRIMARY KEY,
    teacher_id VARCHAR(50) UNIQUE NOT NULL, -- e.g. TCH-101
    name VARCHAR(150) NOT NULL,
    name_en VARCHAR(150),
    designation VARCHAR(100) NOT NULL,      -- e.g. সহকারী শিক্ষক
    subject VARCHAR(100),
    phone VARCHAR(25) NOT NULL,
    email VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'teacher',     -- admin, teacher, staff
    assigned_class VARCHAR(50),             -- e.g. 6th
    assigned_section VARCHAR(50),           -- e.g. A
    joining_date DATE,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. STUDENTS
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(50) PRIMARY KEY,             -- e.g. STD-6th-A-1
    roll VARCHAR(20) NOT NULL,              -- e.g. 01
    name VARCHAR(150) NOT NULL,
    name_en VARCHAR(150),
    grade VARCHAR(50) NOT NULL,             -- 6th, 7th, 8th, 9th, 10th
    section VARCHAR(50) DEFAULT 'A',
    stream_group VARCHAR(50) DEFAULT 'সাধারণ', -- সাধারণ, বিজ্ঞান, মানবিক, ব্যবসায় শিক্ষা
    optional_subject VARCHAR(100),
    guardian VARCHAR(150),
    guardian_relation VARCHAR(50),
    father_name VARCHAR(150),
    father_name_en VARCHAR(150),
    father_nid VARCHAR(50),
    mother_name VARCHAR(150),
    mother_name_en VARCHAR(150),
    mother_nid VARCHAR(50),
    mobile VARCHAR(25) NOT NULL,
    birth_reg_no VARCHAR(50),
    dob DATE,
    gender VARCHAR(20) DEFAULT 'Male',      -- Male, Female
    religion VARCHAR(30) DEFAULT 'Islam',   -- Islam, Hindu, Buddhist, Christian
    blood_group VARCHAR(10),
    current_address TEXT,
    permanent_address TEXT,
    photo TEXT,                             -- Base64 compressed image or URL
    session_year VARCHAR(20) DEFAULT '2026',
    is_stipend BOOLEAN DEFAULT FALSE,
    stipend_category VARCHAR(50),
    gpa VARCHAR(10) DEFAULT '5.00',
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. ATTENDANCE (DAILY ATTENDANCE)
CREATE TABLE IF NOT EXISTS daily_attendance (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    grade VARCHAR(50) NOT NULL,
    section VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,            -- Present, Absent, Leave
    taken_by_teacher_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_daily_attendance UNIQUE (student_id, attendance_date)
);

-- 7. EXAMS & MARKS
CREATE TABLE IF NOT EXISTS exams (
    id VARCHAR(50) PRIMARY KEY,
    exam_name VARCHAR(150) NOT NULL,        -- e.g. ১ম সাময়িক পরীক্ষা, বার্ষিক পরীক্ষা, নির্বাচনী পরীক্ষা
    session_year VARCHAR(20) NOT NULL,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS exam_marks (
    id VARCHAR(50) PRIMARY KEY,
    exam_id VARCHAR(50) NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_code VARCHAR(50) NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    marks_cq NUMERIC(5,2) DEFAULT 0,
    marks_mcq NUMERIC(5,2) DEFAULT 0,
    marks_practical NUMERIC(5,2) DEFAULT 0,
    marks_ca NUMERIC(5,2) DEFAULT 0,
    total_marks NUMERIC(5,2) NOT NULL,
    grade_point NUMERIC(3,2) NOT NULL,      -- e.g. 5.00
    grade_letter VARCHAR(5) NOT NULL,       -- e.g. A+, A, A-
    is_passed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_exam_subject UNIQUE (exam_id, student_id, subject_code)
);

-- 8. FEES & ACCOUNTS TRANSACTIONS
CREATE TABLE IF NOT EXISTS fee_collections (
    id VARCHAR(50) PRIMARY KEY,
    receipt_no VARCHAR(50) UNIQUE NOT NULL,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    fee_type VARCHAR(100) NOT NULL,         -- মাসিক বেতন, ভর্তি ফি, পরীক্ষা ফি
    amount NUMERIC(10,2) NOT NULL,
    waiver_amount NUMERIC(10,2) DEFAULT 0,
    net_amount NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Cash', -- Cash, bKash, Bank
    collected_by VARCHAR(50),
    payment_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Paid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. SSC TRANSCRIPT & TESTIMONIALS (ISSUED REGISTER)
CREATE TABLE IF NOT EXISTS ssc_testimonials (
    id VARCHAR(50) PRIMARY KEY,
    ref_no VARCHAR(100) UNIQUE NOT NULL,    -- e.g. BHS/SSC-TEST/2026/842
    student_name VARCHAR(150) NOT NULL,
    father_name VARCHAR(150) NOT NULL,
    mother_name VARCHAR(150) NOT NULL,
    ssc_roll VARCHAR(30) NOT NULL,
    ssc_reg VARCHAR(30) NOT NULL,
    passing_year INT NOT NULL,
    gpa VARCHAR(10) NOT NULL,
    stream_group VARCHAR(50) NOT NULL,
    board_name VARCHAR(50) DEFAULT 'Chattogram',
    dob DATE,
    qr_code_payload TEXT,
    issue_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Issued',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR HIGH-SPEED LOOKUP & DASHBOARD QUERIES
CREATE INDEX IF NOT EXISTS idx_students_grade_section ON students(grade, section);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON daily_attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_marks_exam_student ON exam_marks(exam_id, student_id);
CREATE INDEX IF NOT EXISTS idx_fees_payment_date ON fee_collections(payment_date);
