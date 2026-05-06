DROP DATABASE IF EXISTS CUNY0;
CREATE DATABASE CUNY0;
USE CUNY0;

-- ACCOUNT — parent of the "is a" relationship between student, instructor, registrar
CREATE TABLE account (
    user_id        INT PRIMARY KEY AUTO_INCREMENT,
    first_name     VARCHAR(50),
    last_name      VARCHAR(50),
    email          VARCHAR(100) UNIQUE,
    dob            DATE,
    password_hash  VARCHAR(255),
    role           ENUM('student','instructor','registrar') NOT NULL
);

-- PROGRAM — needed before student (enrolled_in)

CREATE TABLE program (
    program_id        INT PRIMARY KEY,
    program_name      VARCHAR(100),
    degree_type       VARCHAR(50),
    department        VARCHAR(100),
    total_credit_req  INT
);

-- STUDENT / INSTRUCTOR / REGISTRAR — subtypes of account
-- PK is also FK to account.user_id ("is a" pattern)

CREATE TABLE student (
    student_id         INT PRIMARY KEY,
    gpa                DECIMAL(3,2),
    status             VARCHAR(50),
    enrollment_date    DATE,
    academic_standing  VARCHAR(50),
    program_id         INT,
    FOREIGN KEY (student_id) REFERENCES account(user_id),
    FOREIGN KEY (program_id) REFERENCES program(program_id)
);

CREATE TABLE instructor (
    instructor_id  INT PRIMARY KEY,
    department     VARCHAR(100),
    hire_date      DATE,
    subject        VARCHAR(100),
    FOREIGN KEY (instructor_id) REFERENCES account(user_id)
);

CREATE TABLE registrar (
    registrar_id     INT PRIMARY KEY,
    office_location  VARCHAR(200),
    department       VARCHAR(100),
    FOREIGN KEY (registrar_id) REFERENCES account(user_id)
);

-- COURSE

CREATE TABLE course (
    course_id    INT PRIMARY KEY,
    course_name  VARCHAR(150),
    course_code  VARCHAR(20),
    credits      INT,
    department   VARCHAR(100)
);

-- SECTION — course "offers" section, instructor "teaches"

CREATE TABLE section (
    section_id     INT PRIMARY KEY,
    course_id      INT,
    instructor_id  INT,
    semester       VARCHAR(20),
    year           INT,
    room           VARCHAR(50),
    seats          INT,
    is_full        BOOLEAN DEFAULT FALSE,
    schedule       VARCHAR(100),
    FOREIGN KEY (course_id)     REFERENCES course(course_id),
    FOREIGN KEY (instructor_id) REFERENCES instructor(instructor_id)
);

-- ENROLLMENT — associative entity between student and section

CREATE TABLE enrollment (
    enrollment_id  INT PRIMARY KEY AUTO_INCREMENT,
    student_id     INT,
    section_id     INT,
    FOREIGN KEY (student_id) REFERENCES student(student_id),
    FOREIGN KEY (section_id) REFERENCES section(section_id),
    UNIQUE (student_id, section_id)
);

-- GRADE — enrollment "receives" grade, "graded_by" instructor

CREATE TABLE grade (
    grade_id       INT PRIMARY KEY AUTO_INCREMENT,
    enrollment_id  INT,
    instructor_id  INT,
    letter_grade   VARCHAR(2),
    numeric_grade  DECIMAL(5,2),
    date_assigned  DATE,
    FOREIGN KEY (enrollment_id) REFERENCES enrollment(enrollment_id),
    FOREIGN KEY (instructor_id) REFERENCES instructor(instructor_id)
);

-- PERFORMANCE — student "has" performance reports (1:N)

CREATE TABLE performance (
    report_id     INT PRIMARY KEY AUTO_INCREMENT,
    student_id    INT,
    semester      VARCHAR(20),
    year          INT,
    gpa_snapshot  DECIMAL(3,2),
    comments      TEXT,
    FOREIGN KEY (student_id) REFERENCES student(student_id)
);


-- DISCIPLINARY
--   student_id  -> student "receives"
--   created_by  -> instructor who writes it ("creates")
--   issued_by   -> account (instructor OR registrar) who issues it

CREATE TABLE disciplinary (
    action_id     INT PRIMARY KEY AUTO_INCREMENT,
    student_id    INT,
    created_by    INT,
    issued_by     INT,
    issue_date    DATE,
    action_type   VARCHAR(50),
    reason        TEXT,
    description   TEXT,
    resolution    TEXT,
    FOREIGN KEY (student_id) REFERENCES student(student_id),
    FOREIGN KEY (created_by) REFERENCES instructor(instructor_id),
    FOREIGN KEY (issued_by)  REFERENCES account(user_id)
);

-- ADMISSION — registrar "reviews" admission (1:N)

CREATE TABLE admission (
    admission_id    INT PRIMARY KEY AUTO_INCREMENT,
    applicant_name  VARCHAR(100),
    email           VARCHAR(100),
    status          VARCHAR(50),
    registrar_id    INT,
    FOREIGN KEY (registrar_id) REFERENCES registrar(registrar_id)
);

-- AI QUERY LOG — registrar "generates" queries (1:N)

CREATE TABLE ai_query_log (
    query_id          INT PRIMARY KEY AUTO_INCREMENT,
    registrar_id      INT,
    query_text        TEXT,
    response_text     TEXT,
    context_source    VARCHAR(200),
    fallback_warning  BOOLEAN DEFAULT FALSE,
    timestamp         DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (registrar_id) REFERENCES registrar(registrar_id)
);

-- TRIGGER — makes sure that issued_by is an instructor or registrar
-- (FK alone allows any account, including students)

DELIMITER $$
CREATE TRIGGER trg_disciplinary_issuer_role
BEFORE INSERT ON disciplinary
FOR EACH ROW
BEGIN
    DECLARE issuer_role VARCHAR(20);
    SELECT role INTO issuer_role FROM account WHERE user_id = NEW.issued_by;
    IF issuer_role NOT IN ('instructor','registrar') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Disciplinary actions can only be issued by an instructor or registrar';
    END IF;
END$$
DELIMITER ;


