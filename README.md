# What is VulnMCP?
VulnMCP is an Agentic AI CTF platform which includes three chatbots named FileBot, SQLBot, HealthCheckBot.

You can pratice prompt injection methods to exploit application security vulnerabilities such as path traversal or command injection.

# Who is it for?
VulnMCP is for everyone who wants to practice prompt injection methods and Agentic AI pentesting freely.

## Note:
Vulnerable mode does not mean your prompt injection method will directly work. Different models act differently on same prompts and they have their own internal safeguards.

---

# Information about platform
You can find necessary informations such as:
- Database layout for SQLBot
- File and folder structure for FileBot
- Command Structure for HealthCheckBot
- Adding additional pullable ollama model

... via [IntroductoryFiles](IntroductoryFiles) folder.
 
# Installation (Linux)

## Requirements
* **Docker:** `docker --version`
* **Compose:** `docker compose version`

**Note:** you have to execute docker compose commands on installation root where Dockerfile is located.

If docker is not installed you can install it with `install.sh` script:
```bash
sudo chmod +x install.sh
sudo ./install.sh
```

## Running the Application
```bash
git clone https://github.com/odabasi52/VulnMCP.git
cd VulnMCP
sudo docker compose up -d --build
```

## Accessing the Application
| Servis | URL | Açıklama |
| :--- | :--- | :--- |
| **User Interface (UI)** | http://localhost | React UI (via nginx) |
| **Backend API** | http://localhost:3000 | chatbot-app Express server |
| **Ollama** | http://localhost:11435 | LLM API |
| **PostgreSQL** | localhost:5432 | DB (user: team, pass: team.123, db: vulnmcp) |

## Logs
Chatbot-app logs (MCP Connection, Tool Selection, SQL Queries, PromptWAF Mode, Bot Mode etc.) can be read through below command:
```bash
sudo docker compose logs -f chatbot-app
```

To read all service logs:
```bash
sudo docker compose logs -f
```

## 🛠 Frequently Used Commands
| İşlem | Komut |
| :--- | :--- |
| **Start** | `sudo docker compose up -d --build` |
| **Read Logs** | `sudo docker compose logs -f chatbot-app` |
| **Stop** | `sudo docker compose down` |
| **Stop and Remove Data** | `sudo docker compose down -v` |
| **Restart** | `sudo docker compose restart` |
| **Status Check** | `sudo docker compose ps` |

## ⚠️ Problems
*"permission denied"* error can be fixed with `sudo`. Also, you can add your user to docker group as seen below:
```bash
sudo usermod -aG docker $USER
newgrp docker
```
