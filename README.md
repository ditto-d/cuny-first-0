# 🎓 CunyFirstZero – AI-Powered College Management System

##  Overview

CunyFirstZero is an AI-enabled College Management System (CMS) designed to streamline academic and administrative workflows within a college environment.

The platform supports the full lifecycle of students and instructors, from application and registration to grading and graduation, while integrating AI-powered assistance using Retrieval-Augmented Generation (RAG) and Large Language Models (LLMs).


---

##  Key Features

* 🧑‍🎓 Student lifecycle management (admissions → graduation)
* 📚 Course registration with conflict detection & waitlists
* 🧑‍🏫 Instructor course and grading management
* ⚖️ Academic monitoring (GPA tracking, warnings, suspension)
* ⭐ Course reviews with taboo-word filtering
* 🤖 AI Assistant (RAG + LLM fallback)
* 🔐 Role-based access control (RBAC)
* 📊 Automated GPA + honor roll system

---

##  User Roles

* **Visitor** – Browse & apply
* **Student** – Register, review, graduate
* **Instructor** – Manage courses & grades
* **Registrar** – Full system control

---

##  Tech Stack

### Frontend

* React.js
* React Big Calendar

### Backend

* Python (Flask)

### Database

* MongoDB (primary)
* ChromaDB (vector storage)

### AI Integration

* OpenAI API (LLM)
* RAG pipeline (local knowledge base)

---

## System Architecture

```
Frontend (React)
      ↓
Backend API (Flask)
      ↓
MongoDB + Vector DB (ChromaDB)
      ↓
AI Layer (RAG → OpenAI fallback)
```

---


##  Project Structure

```
cunyfirstzero/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   └── services/
│
├── backend/
│   ├── routes/
│   ├── models/
│   ├── services/
│   └── app.py
│
├── ai/
│   ├── rag_pipeline.py
│   └── embeddings/
│
├── docs/
│   └── SRS.pdf
│
└── README.md
```




