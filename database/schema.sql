-- this is in postgresql 

DROP TABLE IF EXISTS ai_query_log, admission, disciplinary, performance,
                     grade, enrollment, section, course, program,
                     registrar, instructor, student, department, account CASCADE;

-- ACCOUNT — parent of the "is a" specialization
CREATE TABLE account (
    user_id        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_type   VARCHAR(50) NOT NULL CHECK (account_type IN ('student','instructor','registrar')),
    first_name     VARCHAR(100) NOT NULL,
    last_name      VARCHAR(100) NOT NULL,
    email          VARCHAR(255) UNIQUE NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    dob            DATE,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- DEPARTMENT —  comes before instructor
CREATE TABLE department (
    department_id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    department_name  VARCHAR(100) NOT NULL,
    department_code  VARCHAR(10) UNIQUE NOT NULL,
    office_location  VARCHAR(100),
    phone            VARCHAR(20),
    chair_id         INT  -- FK added later (circular with instructor)
);

-- PROGRAM — needed before student (enrolled_in FK)
CREATE TABLE program (
    program_id        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    program_name      VARCHAR(100) NOT NULL,
    degree_type       VARCHAR(50) CHECK (degree_type IN ('Associate','Bachelor','Master','Doctorate')),
    department_id     INT NOT NULL,
    total_credit_req  INT CHECK (total_credit_req > 0),
    FOREIGN KEY (department_id) REFERENCES department(department_id)
);

-- STUDENT — subtype of account
CREATE TABLE student (
    student_id         INT PRIMARY KEY,
    gpa                NUMERIC(3,2) DEFAULT 0.00 CHECK (gpa >= 0.00 AND gpa <= 4.00),
    is_active          BOOLEAN DEFAULT FALSE,
    enrollment_date    DATE,
    academic_standing  VARCHAR(50),
    program_id         INT,
    FOREIGN KEY (student_id) REFERENCES account(user_id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES program(program_id)
);

-- INSTRUCTOR — subtype of account
CREATE TABLE instructor (
    instructor_id   INT PRIMARY KEY,
    department_id   INT NOT NULL,
    hire_date       DATE,
    specialization  VARCHAR(100),
    FOREIGN KEY (instructor_id) REFERENCES account(user_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES department(department_id)
);

-- Resolve circular FK: department.chair_id -> instructor
ALTER TABLE department
    ADD CONSTRAINT fk_department_chair
        FOREIGN KEY (chair_id) REFERENCES instructor(instructor_id);

-- REGISTRAR — subtype of account
CREATE TABLE registrar (
    registrar_id     INT PRIMARY KEY,
    office_location  VARCHAR(200),
    hire_date        DATE,
    FOREIGN KEY (registrar_id) REFERENCES account(user_id) ON DELETE CASCADE
);

-- COURSE
CREATE TABLE course (
    course_id      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    course_name    VARCHAR(150) NOT NULL,
    course_code    VARCHAR(20) UNIQUE NOT NULL,
    credits        INT CHECK (credits > 0),
    department_id  INT NOT NULL,
    FOREIGN KEY (department_id) REFERENCES department(department_id)
);

-- SECTION
CREATE TABLE section (
    section_id     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    course_id      INT NOT NULL,
    instructor_id  INT,
    semester       VARCHAR(20) CHECK (semester IN ('Fall','Spring','Summer','Winter')),
    year           INT CHECK (year >= 2000),
    room           VARCHAR(50),
    seats          INT CHECK (seats >= 0),
    is_full        BOOLEAN DEFAULT FALSE,
    schedule       VARCHAR(100),
    FOREIGN KEY (course_id)     REFERENCES course(course_id),
    FOREIGN KEY (instructor_id) REFERENCES instructor(instructor_id) ON DELETE SET NULL
);

-- ENROLLMENT
CREATE TABLE enrollment (
    enrollment_id  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id     INT NOT NULL,
    section_id     INT NOT NULL,
    enrolled_at    TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES section(section_id) ON DELETE CASCADE,
    UNIQUE (student_id, section_id)
);

-- GRADE
CREATE TABLE grade (
    grade_id       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    enrollment_id  INT NOT NULL UNIQUE,
    instructor_id  INT,
    letter_grade   VARCHAR(2) CHECK (letter_grade IN ('A','A-','B+','B','B-','C+','C','C-','D+','D','F','W','I')),
    numeric_grade  NUMERIC(5,2) CHECK (numeric_grade >= 0 AND numeric_grade <= 100),
    date_assigned  DATE DEFAULT CURRENT_DATE,
    FOREIGN KEY (enrollment_id) REFERENCES enrollment(enrollment_id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES instructor(instructor_id) ON DELETE SET NULL
);

-- PERFORMANCE
CREATE TABLE performance (
    report_id     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id    INT NOT NULL,
    semester      VARCHAR(20) CHECK (semester IN ('Fall','Spring','Summer','Winter')),
    year          INT CHECK (year >= 2000),
    gpa_snapshot  NUMERIC(3,2) CHECK (gpa_snapshot >= 0.00 AND gpa_snapshot <= 4.00),
    comments      TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE
);

-- DISCIPLINARY
CREATE TABLE disciplinary (
    action_id     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id    INT NOT NULL,
    created_by    INT NOT NULL,
    issued_by     INT NOT NULL,
    issue_date    DATE DEFAULT CURRENT_DATE,
    action_type   VARCHAR(50) CHECK (action_type IN ('Warning','Probation','Suspension','Expulsion')),
    reason        TEXT,
    description   TEXT,
    resolution    TEXT,
    FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES instructor(instructor_id),
    FOREIGN KEY (issued_by)  REFERENCES account(user_id)
);

-- ADMISSION
CREATE TABLE admission (
    admission_id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    applicant_name  VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    status          VARCHAR(50) CHECK (status IN ('Pending','Accepted','Rejected','Waitlisted')),
    registrar_id    INT,
    submitted_at    TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (registrar_id) REFERENCES registrar(registrar_id) ON DELETE SET NULL
);

-- AI QUERY LOG
CREATE TABLE ai_query_log (
    query_id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    registrar_id      INT,
    query_text        TEXT NOT NULL,
    response_text     TEXT,
    context_source    VARCHAR(200),
    fallback_warning  BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (registrar_id) REFERENCES registrar(registrar_id) ON DELETE SET NULL
);

-- TRIGGER — issued_by must be an instructor or registrar
CREATE OR REPLACE FUNCTION check_disciplinary_issuer()
RETURNS TRIGGER AS $$
DECLARE
    issuer_role VARCHAR(50);
BEGIN
    SELECT account_type INTO issuer_role FROM account WHERE user_id = NEW.issued_by;
    IF issuer_role NOT IN ('instructor','registrar') THEN
        RAISE EXCEPTION 'Disciplinary actions can only be issued by an instructor or registrar';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_disciplinary_issuer_role
BEFORE INSERT OR UPDATE ON disciplinary
FOR EACH ROW
EXECUTE FUNCTION check_disciplinary_issuer();