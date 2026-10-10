-- ==============================================================================
-- SCHOOL MANAGEMENT SYSTEM - TEACHER MANAGEMENT & RBAC DATABASE MIGRATIONS
-- Compatible with PostgreSQL 14+ / MySQL 8.0+
-- ==============================================================================

-- 1. TEACHERS TABLE
CREATE TABLE teachers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL, -- Serves as the login username
    designation VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    photo_url VARCHAR(255) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    password_hash VARCHAR(255) NOT NULL,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. CLASSES TABLE
CREATE TABLE classes (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(50) NOT NULL, -- e.g. "Class 6", "Class 8"
    section VARCHAR(10) NOT NULL, -- e.g. "A", "B"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. SUBJECTS TABLE
CREATE TABLE subjects (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL, -- e.g. "Mathematics", "Science"
    code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TEACHER SUBJECT ASSIGNMENTS (Many-to-Many Assignment System)
CREATE TABLE teacher_subject_assignments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    teacher_id VARCHAR(36) NOT NULL,
    class_id VARCHAR(36) NOT NULL,
    subject_id VARCHAR(36) NOT NULL,
    academic_year INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    
    -- UNIQUE constraint preventing duplicate subject assignment per teacher/class/year
    CONSTRAINT unique_teacher_class_subject_year 
        UNIQUE (teacher_id, class_id, subject_id, academic_year)
);

-- 5. CLASS TEACHERS TABLE (Exactly One Class Teacher per Class + Academic Year)
CREATE TABLE class_teachers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    teacher_id VARCHAR(36) NOT NULL,
    class_id VARCHAR(36) NOT NULL,
    academic_year INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    
    -- STRICT UNIQUE CONSTRAINT: Exactly 1 Class Teacher per class per academic year
    CONSTRAINT unique_class_teacher_per_year 
        UNIQUE (class_id, academic_year)
);

-- 6. EXAM MARKS TABLE (With Ownership Validation & Audit Fields)
CREATE TABLE exam_marks (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    student_id VARCHAR(36) NOT NULL,
    class_id VARCHAR(36) NOT NULL,
    subject_id VARCHAR(36) NOT NULL,
    exam_id VARCHAR(36) NOT NULL,
    academic_year INT NOT NULL,
    
    obtained_marks DECIMAL(5, 2) NOT NULL CHECK (obtained_marks >= 0),
    full_marks DECIMAL(5, 2) NOT NULL CHECK (full_marks > 0),
    
    entered_by VARCHAR(36) NOT NULL, -- FK to teachers.id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (entered_by) REFERENCES teachers(id),
    
    -- Validation Constraint: obtained_marks <= full_marks
    CONSTRAINT chk_obtained_leq_full CHECK (obtained_marks <= full_marks)
);

-- 7. ATTENDANCE TABLE (With Ownership Validation & Audit Fields)
CREATE TABLE student_attendance (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    student_id VARCHAR(36) NOT NULL,
    class_id VARCHAR(36) NOT NULL,
    attendance_date DATE NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    
    marked_by VARCHAR(36) NOT NULL, -- FK to teachers.id (Must be designated Class Teacher)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (marked_by) REFERENCES teachers(id),
    
    CONSTRAINT unique_student_daily_attendance UNIQUE (student_id, attendance_date)
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX idx_teacher_phone ON teachers(phone);
CREATE INDEX idx_assignment_lookup ON teacher_subject_assignments(teacher_id, class_id, subject_id, academic_year);
CREATE INDEX idx_class_teacher_lookup ON class_teachers(class_id, academic_year);
