erDiagram
    %% ========================================
    %% USER & PROFILE
    %% ========================================
    USER ||--|| PERSONALINFO : has
    USER ||--o{ EDUCATION : has
    USER ||--o{ TRAINING : has
    USER ||--o{ ACHIEVEMENT : has
    USER ||--o{ CAREER : has
    USER ||--o{ JOBAPPLICATION : has
    USER ||--o{ AIANALYSIS : has
    USER ||--o{ RESUME : has
    USER ||--o{ COVERLETTER : has
    USER ||--o{ AGENTINTERACTION : has
    USER ||--o{ COMPANY_RESEARCH_NOTE : has
    USER ||--o{ UPLOADED_DOCUMENT : has
    USER ||--o{ FIELD_MAPPING : has
    
    USER {
        int user_id PK
        varchar email "NOT_NULL"
        varchar password_hash "NOT_NULL"
        varchar first_name "NOT_NULL"
        varchar last_name "NOT_NULL"
        varchar phone
        varchar location
        timestamp created_at "NOT_NULL"
        timestamp updated_at "NOT_NULL"
    }
    
    PERSONALINFO {
        int info_id PK
        int user_id FK
        varchar address
        varchar city
        varchar state
        varchar country
        varchar postal_code
        varchar linkedin_url
        varchar portfolio_url
        text summary
    }
    
    EDUCATION {
        int education_id PK
        int user_id FK
        varchar institution_name "NOT_NULL"
        varchar degree_type "NOT_NULL"
        varchar field_of_study "NOT_NULL"
        date start_date "NOT_NULL"
        date end_date "NOT_NULL"
        decimal gpa
        text achievements
    }
    
    TRAINING {
        int training_id PK
        int user_id FK
        varchar training_name "NOT_NULL"
        varchar provider "NOT_NULL"
        date completion_date
        varchar credential_id
        date expiration_date
    }
    
    ACHIEVEMENT {
        int achievement_id PK
        int user_id FK
        varchar title "NOT_NULL"
        text description
        date date_achieved "NOT_NULL"
        varchar issuing_organization
    }
    
    %% ========================================
    %% CAREER HISTORY
    %% ========================================
    CAREER ||--o{ RESPONSIBILITY : has
    CAREER ||--o{ CAREER_ACHIEVEMENT : has
    
    CAREER {
        int career_id PK
        int user_id FK
        varchar company_name "NOT_NULL"
        varchar job_title "NOT_NULL"
        date start_date "NOT_NULL"
        date end_date "NOT_NULL"
        text description
        varchar location
    }
    
    RESPONSIBILITY {
        int responsibility_id PK
        int career_id FK
        text statement "NOT_NULL"
        timestamp created_at
    }
    
    CAREER_ACHIEVEMENT {
        int career_achievement_id PK
        int career_id FK
        text statement "NOT_NULL"
        varchar impact_metrics
        timestamp created_at
    }
    
    RESPONSIBILITY ||--o{ RESPONSIBILITY_RELEVANCE : has
    CAREER_ACHIEVEMENT ||--o{ CAREER_ACHIEVEMENT_RELEVANCE : has
    
    RESPONSIBILITY_RELEVANCE {
        int relevance_id PK
        int responsibility_id FK
        int job_id FK
        varchar role_category
        decimal relevance_score "NOT_NULL"
        timestamp scored_date "NOT_NULL"
    }
    
    CAREER_ACHIEVEMENT_RELEVANCE {
        int relevance_id PK
        int career_achievement_id FK
        int job_id FK
        varchar role_category
        decimal relevance_score "NOT_NULL"
        timestamp scored_date "NOT_NULL"
    }
    
    %% ========================================
    %% COMPANY INTELLIGENCE
    %% ========================================
    COMPANY ||--o{ JOBPOSTING : has
    COMPANY ||--o{ AIANALYSIS : has
    COMPANY ||--|| COMPANY_PROFILE : has
    COMPANY ||--o{ COMPANY_RATING : has
    COMPANY ||--o{ COMPANY_RESEARCH_NOTE : has
    
    COMPANY {
        int company_id PK
        varchar company_name "NOT_NULL"
        varchar industry
        varchar size
        varchar location
        varchar website
        text description
    }
    
    COMPANY_PROFILE {
        int profile_id PK
        int company_id FK
        text mission_statement
        text vision_statement
        text values
        text philosophy
        text culture_description
        timestamp last_updated "NOT_NULL"
        int assembled_by_agent_id FK
    }
    
    COMPANY_RATING {
        int rating_id PK
        int company_id FK
        varchar platform "NOT_NULL"
        decimal overall_rating
        decimal culture_rating
        decimal work_life_balance_rating
        decimal compensation_rating
        int review_count
        timestamp last_updated "NOT_NULL"
    }
    
    COMPANY_RESEARCH_NOTE {
        int note_id PK
        int company_id FK
        int user_id FK
        text note_content "NOT_NULL"
        varchar source_url
        timestamp created_at "NOT_NULL"
        timestamp updated_at "NOT_NULL"
    }
    
    %% ========================================
    %% JOB POSTINGS & APPLICATIONS
    %% ========================================
    JOBPOSTING ||--|| SALARYINFO : has
    JOBPOSTING ||--o{ JOBAPPLICATION : has
    JOBPOSTING ||--o{ AIANALYSIS : has
    JOBPOSTING ||--o{ RESUME : has
    JOBPOSTING ||--o{ COVERLETTER : has
    JOBPOSTING }o--o| AGENTINTERACTION : references
    JOBPOSTING ||--o{ RESPONSIBILITY_RELEVANCE : has
    JOBPOSTING ||--o{ CAREER_ACHIEVEMENT_RELEVANCE : has
    
    JOBPOSTING {
        int job_id PK
        int company_id FK
        varchar job_title "NOT_NULL"
        text description
        text requirements
        varchar location
        varchar remote_option
        date posted_date "NOT_NULL"
        date application_deadline "NOT_NULL"
        varchar posting_url
    }
    
    JOBAPPLICATION {
        int application_id PK
        int user_id FK
        int job_id FK
        varchar status "NOT_NULL"
        date applied_date "NOT_NULL"
        date last_updated
        text notes
    }
    
    SALARYINFO {
        int salary_id PK
        int job_id FK
        decimal company_offered_salary "NOT_NULL"
        decimal user_expected_salary "NOT_NULL"
        decimal industry_average_salary "NOT_NULL"
        varchar region
        varchar currency
        decimal salary_range_min
        decimal salary_range_max
    }
    
    %% ========================================
    %% AI ANALYSIS & DOCUMENTS
    %% ========================================
    AIANALYSIS ||--o{ RESUME : "links to"
    AIANALYSIS ||--o{ COVERLETTER : "links to"
    
    AIANALYSIS {
        int analysis_id PK
        int user_id FK
        int job_id FK
        int company_id FK
        decimal fit_score "NOT_NULL"
        text strengths
        text gaps
        text recommendations
        date analysis_date "NOT_NULL"
    }
    
    RESUME {
        int resume_id PK
        int user_id FK
        int job_id FK
        int analysis_id FK
        int uploaded_document_id FK
        varchar title "NOT_NULL"
        text content
        varchar format
        date created_date "NOT_NULL"
        date last_modified
    }
    
    COVERLETTER {
        int cover_letter_id PK
        int user_id FK
        int job_id FK
        int analysis_id FK
        text content
        date created_date "NOT_NULL"
        date last_modified
    }
    
    RESUME }o--|| UPLOADED_DOCUMENT : references
    
    %% ========================================
    %% AI AGENTS
    %% ========================================
    AIAGENT ||--o{ AGENTINTERACTION : has
    AIAGENT ||--o{ COMPANY_PROFILE : assembles
    AIAGENT ||--o{ DOCUMENT_EXTRACTION : has
    
    AIAGENT {
        int agent_id PK
        varchar agent_type
        text description
    }
    
    AGENTINTERACTION {
        int interaction_id PK
        int user_id FK
        int agent_id FK
        int job_id FK
        int company_id FK
        text query
        text response
        date interaction_date "NOT_NULL"
    }
    
    AGENTINTERACTION }o--|| COMPANY : references
    
    %% ========================================
    %% DOCUMENT MANAGEMENT
    %% ========================================
    UPLOADED_DOCUMENT ||--o{ DOCUMENT_EXTRACTION : has
    
    UPLOADED_DOCUMENT {
        int uploaded_document_id PK
        int user_id FK
        varchar document_type
        varchar file_name
        varchar file_path
        int file_size
        varchar mime_type
        timestamp upload_date
        boolean processed
        timestamp processed_date
    }
    
    DOCUMENT_EXTRACTION {
        int extraction_id PK
        int uploaded_document_id FK
        int agent_id FK
        text extracted_content
        text structured_data
        timestamp extraction_date
        decimal confidence_score
    }
    
    DOCUMENT_EXTRACTION ||--o{ FIELD_MAPPING : has
    
    FIELD_MAPPING {
        int mapping_id PK
        int extraction_id FK
        int user_id FK
        varchar source_field
        varchar target_entity
        varchar target_field
        text extracted_value
        text mapped_value
        varchar mapping_status
        timestamp created_at
        timestamp confirmed_at
    }
