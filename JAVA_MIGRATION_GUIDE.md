# Java Backend Migration Guide

## 📋 Overview

This guide explains the migration from Python (FastAPI) to Java (Spring Boot) backend.

## 🎯 Migration Status

### ✅ Completed (Phase 1)
- [x] Project structure setup
- [x] Maven configuration with all dependencies
- [x] Domain models (JPA entities)
- [x] Repository layer (Spring Data)
- [x] DTO classes
- [x] JWT security utilities
- [x] Application configuration

### 🚧 In Progress (Phase 2)
- [ ] Service layer implementation
- [ ] REST controllers
- [ ] Security configuration
- [ ] Data source connectors
- [ ] RAG service with LangChain4j

### 📅 Planned (Phase 3)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Data migration scripts
- [ ] Performance optimization
- [ ] Documentation

## 🔄 Architecture Comparison

### Python Stack → Java Stack

| Component | Python | Java |
|-----------|--------|------|
| **Framework** | FastAPI | Spring Boot 3.2 |
| **ORM** | SQLAlchemy | Spring Data JPA / Hibernate |
| **Validation** | Pydantic | Bean Validation (JSR-380) |
| **Security** | python-jose | Spring Security + JJWT |
| **HTTP Client** | httpx | OkHttp / RestTemplate |
| **AI/RAG** | LangChain + Ollama | LangChain4j + Ollama |
| **Embeddings** | sentence-transformers | DJL / LangChain4j embeddings |
| **Vector DB** | ChromaDB Python | ChromaDB HTTP API |
| **Testing** | pytest | JUnit 5 + Mockito |
| **Build Tool** | pip | Maven |

## 📦 Dependency Mapping

### Core Dependencies

```xml
<!-- Python: fastapi -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<!-- Python: sqlalchemy -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>

<!-- Python: python-jose[cryptography] -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.3</version>
</dependency>

<!-- Python: langchain -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
    <version>0.26.1</version>
</dependency>

<!-- Python: ollama -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-ollama</artifactId>
    <version>0.26.1</version>
</dependency>
```

## 🏗️ Code Migration Examples

### 1. Models

**Python (SQLAlchemy):**
```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
```

**Java (JPA):**
```java
@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String username;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
```

### 2. Repositories

**Python:**
```python
def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()
```

**Java:**
```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
}
```

### 3. Services

**Python:**
```python
class AuthService:
    def authenticate(self, username: str, password: str):
        user = get_user_by_username(db, username)
        if not user or not verify_password(password, user.password):
            return None
        return user
```

**Java:**
```java
@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    public User authenticate(String username, String password) {
        return userRepository.findByUsername(username)
            .filter(user -> passwordEncoder.matches(password, user.getPassword()))
            .orElse(null);
    }
}
```

### 4. Controllers

**Python (FastAPI):**
```python
@app.post("/auth/login")
async def login(login_data: LoginRequest):
    user = authenticate_user(db, login_data.username, login_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}
```

**Java (Spring Boot):**
```java
@RestController
@RequestMapping("/auth")
public class AuthController {
    @Autowired
    private AuthService authService;
    
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        User user = authService.authenticate(request.getUsername(), request.getPassword());
        if (user == null) {
            throw new UnauthorizedException("Invalid credentials");
        }
        String token = jwtUtil.generateToken(user);
        return ResponseEntity.ok(AuthResponse.builder()
            .accessToken(token)
            .tokenType("Bearer")
            .build());
    }
}
```

## 🔐 Security Migration

### JWT Implementation

**Python:**
```python
from jose import jwt

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

**Java:**
```java
public String generateToken(UserDetails userDetails) {
    return Jwts.builder()
        .setSubject(userDetails.getUsername())
        .setIssuedAt(new Date())
        .setExpiration(new Date(System.currentTimeMillis() + expiration))
        .signWith(getSigningKey(), SignatureAlgorithm.HS256)
        .compact();
}
```

## 🤖 AI/RAG Migration

### Ollama Integration

**Python:**
```python
from ollama import Client

client = Client(host='http://localhost:11434')
response = client.chat(model='llama3.2', messages=[
    {'role': 'user', 'content': 'Hello'}
])
```

**Java (LangChain4j):**
```java
OllamaChatModel model = OllamaChatModel.builder()
    .baseUrl("http://localhost:11434")
    .modelName("llama3.2")
    .build();

String response = model.generate("Hello");
```

### Embeddings

**Python:**
```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')
embeddings = model.encode(["text to embed"])
```

**Java:**
```java
AllMiniLmL6V2EmbeddingModel embeddingModel = new AllMiniLmL6V2EmbeddingModel();
Embedding embedding = embeddingModel.embed("text to embed").content();
```

## 📊 Database Migration

### Schema Compatibility

The Java backend uses the same database schema as Python, ensuring zero-downtime migration.

### Migration Steps

1. **Backup Python database:**
```bash
cp backend/data_intelligence.db backend/data_intelligence.db.backup
```

2. **Export data (optional):**
```bash
cd backend
python -c "
from app.database import SessionLocal
from app.models.user import User
import json

db = SessionLocal()
users = db.query(User).all()
data = [{'id': u.id, 'username': u.username, 'email': u.email} for u in users]
print(json.dumps(data, indent=2))
" > users_export.json
```

3. **Use same database with Java:**
```yaml
# application.yml
spring:
  datasource:
    url: jdbc:sqlite:../backend/data_intelligence.db
```

## 🚀 Running Both Backends

### Parallel Testing

Run both backends simultaneously on different ports:

**Python:**
```bash
cd backend
uvicorn app.main:app --port 8000
```

**Java:**
```bash
cd backend-java
mvn spring-boot:run -Dserver.port=8001
```

### Load Balancer Configuration

```nginx
upstream backend {
    server localhost:8000 weight=1;  # Python
    server localhost:8001 weight=3;  # Java (handle more traffic)
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
    }
}
```

## 📈 Performance Comparison

### Benchmarking

```bash
# Python backend
ab -n 1000 -c 10 http://localhost:8000/health

# Java backend
ab -n 1000 -c 10 http://localhost:8001/health
```

### Expected Results

| Metric | Python | Java | Winner |
|--------|--------|------|--------|
| Requests/sec | 500 | 2000 | Java 4x |
| Latency (avg) | 45ms | 15ms | Java 3x |
| Memory | 150MB | 250MB | Python |
| Startup | 2.5s | 3.5s | Python |

## 🎯 Next Steps

### Week 1: Core Services
- [ ] Implement AuthService
- [ ] Implement ChatService
- [ ] Implement DataSourceService
- [ ] Implement TeamService

### Week 2: Connectors
- [ ] ConfluenceConnector
- [ ] JiraConnector
- [ ] BitbucketConnector
- [ ] SlackConnector

### Week 3: RAG & AI
- [ ] RAGService with LangChain4j
- [ ] Vector store integration
- [ ] Embedding service
- [ ] Query processing

### Week 4: Testing & Deployment
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests
- [ ] Performance tests
- [ ] Docker deployment
- [ ] Documentation

## 🤝 Contributing

When contributing to the Java backend:

1. Follow Java naming conventions (camelCase, PascalCase)
2. Use Lombok to reduce boilerplate
3. Write JavaDoc for public methods
4. Add unit tests for new features
5. Run `mvn checkstyle:check` before committing

## 📚 Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [LangChain4j Documentation](https://docs.langchain4j.dev/)
- [Java 21 Features](https://openjdk.org/projects/jdk/21/)
- [Migration Best Practices](https://spring.io/guides/gs/rest-service/)

## ❓ FAQ

**Q: Why migrate to Java?**
A: Better performance, type safety, enterprise tooling, and scalability.

**Q: Will the Python backend be deprecated?**
A: No, both will be maintained. Choose based on your needs.

**Q: Can I use the same database?**
A: Yes! The schema is identical.

**Q: What about AI/ML libraries?**
A: LangChain4j provides excellent Java alternatives.

**Q: How long will migration take?**
A: 3-4 weeks for full feature parity.

---

**Current Status:** Phase 1 Complete (40%)
**Next Milestone:** Service layer implementation
**Target Completion:** 3-4 weeks
