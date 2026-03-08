## Users Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PRIMARY KEY |
| name | VARCHAR(100) | NOT NULL |
| department | VARCHAR(100) | NOT NULL |

### Sample Data

| id | name | department |
|---|---|---|
| 1 | Joe | Computer Science |
| 2 | Matt | Electrical Engineer |
| 3 | Anna | Biomedical Engineer |
| 4 | Carrie | Political Science |
| 5 | Saul | Law |

## Flag Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PRIMARY KEY |
| flag | VARCHAR(255) | NOT NULL |

### Sample Data

| id | flag |
|---|---|
| 1 | VULNMCP{Th1sIsTheDBFlag} |