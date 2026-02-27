// api/cmd/main.go
package main

import (
    "net/http"
    "strings"
    "time"
    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
    "gorm.io/gorm"
    "phishing-sentinel/internal"
	"github.com/joho/godotenv"
	"log"
	"os"
	
)

var (
	db         *gorm.DB
	JWT_SECRET = []byte("your_super_secret_sentinel_key") // Use an env variable in production
)

type Claims struct {
	UserID uint `json:"user_id"`
	jwt.RegisteredClaims
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(401, gin.H{"error": "Authorization header required"})
			return
		}

		// Handle "Bearer <token>" format
		bearerToken := strings.Split(authHeader, " ")
		if len(bearerToken) != 2 {
			c.AbortWithStatusJSON(401, gin.H{"error": "Invalid token format"})
			return
		}

		tokenString := bearerToken[1]
		claims := &Claims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return JWT_SECRET, nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(401, gin.H{"error": "Invalid or expired token"})
			return
		}

		// ✅ Set the userID in the context for handlers to use
		c.Set("userID", claims.UserID)
		c.Next()
	}
}


func handleStats(c *gin.Context) {
    // 1. Get UserID from the JWT middleware context
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "User context missing"})
        return
    }

    var totalScanned int64
    var threatsBlocked int64

    // 2. Query Supabase for this specific user
    db.Model(&internal.ScanLog{}).Where("user_id = ?", userID).Count(&totalScanned)
    db.Model(&internal.ScanLog{}).Where("user_id = ? AND is_spoof = ?", userID, true).Count(&threatsBlocked)

    // Calculate a dynamic trust score (example logic)
    trustScore := 100.0
    if totalScanned > 0 {
        trustScore = 100.0 - (float64(threatsBlocked) / float64(totalScanned) * 100.0)
    }

    c.JSON(http.StatusOK, gin.H{
        "scanned":        totalScanned,
        "threatsBlocked": threatsBlocked,
        "trustScore":     trustScore,
    })
}

func handleAnalyze(c *gin.Context) {
    userID, _ := c.Get("userID")
    var req AnalysisRequest

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // 1. Forward to Python ML Service
    mlResponse, err := forwardToMLService(req)
    if err != nil {
        c.JSON(http.StatusServiceUnavailable, gin.H{"error": "ML Service Unreachable"})
        return
    }

    // 2. Persist to Supabase
    newLog := internal.ScanLog{
        UserID:          userID.(uint),
        URL:             req.URL,
        IsSpoof:         mlResponse.IsSpoof,
        ConfidenceScore: mlResponse.ConfidenceScore,
        ThreatLevel:     mlResponse.ThreatLevel,
        Timestamp:       time.Now(),
    }

    if result := db.Create(&newLog); result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save log"})
        return
    }

    c.JSON(http.StatusOK, mlResponse)
}

func handleLogin(c *gin.Context) {
    var loginReq struct {
        Email    string `json:"email"`
        Password string `json:"password"`
    }
    
    if err := c.ShouldBindJSON(&loginReq); err != nil {
        c.JSON(400, gin.H{"error": "Invalid input"})
        return
    }

    var user internal.User
    if err := db.Where("email = ?", loginReq.Email).First(&user).Error; err != nil {
        c.JSON(401, gin.H{"error": "User not found"})
        return
    }

    // In production, use: bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(loginReq.Password))
    if user.Password != loginReq.Password { 
        c.JSON(401, gin.H{"error": "Wrong password"})
        return
    }

    // Create JWT
    expirationTime := time.Now().Add(24 * time.Hour)
    claims := &Claims{
        UserID: user.ID,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(expirationTime),
        },
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    tokenString, _ := token.SignedString(JWT_SECRET)

    c.JSON(200, gin.H{"token": tokenString})
}

func handleRegister(c *gin.Context) {
    var regReq struct {
        Email    string `json:"email" binding:"required"`
        Password string `json:"password" binding:"required"`
    }

    if err := c.ShouldBindJSON(&regReq); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
        return
    }

    // Check if user already exists
    var existingUser internal.User
    if err := db.Where("email = ?", regReq.Email).First(&existingUser).Error; err == nil {
        c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
        return
    }

    // Create user (Note: Use bcrypt.GenerateFromPassword in production!)
    newUser := internal.User{
        Email:    regReq.Email,
        Password: regReq.Password,
    }

    if err := db.Create(&newUser).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create user"})
        return
    }

    c.JSON(http.StatusCreated, gin.H{"message": "User created successfully"})
}


func main() {
    // Replace with your real Supabase credentials
	err := godotenv.Load("../.env")
    if err != nil {
        log.Fatal("Error loading .env file")
    }

    // 2. Access the variable using the standard library 'os'
    dsn := os.Getenv("DATABASE_URI")
    if dsn == "" {
        log.Fatal("DATABASE_URI not set in .env")
    }

    db = internal.InitDB(dsn)

	var testUser internal.User
		db.Where("email = ?", "admin@sentinel.io").First(&testUser)
		if testUser.ID == 0 {
			db.Create(&internal.User{
				Email:    "admin@sentinel.io",
				Password: "password123", // Use bcrypt in production!
			})
		}

	r := gin.Default()

	r.Use(func(c *gin.Context) {
        c.Writer.Header().Set("Access-Control-Allow-Origin", "*") // For hackathon, allow all
        c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
        c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
        
        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }
        c.Next()
    })

    // Public Routes
    r.POST("/login", handleLogin) // You'll need to write this to issue tokens
	r.POST("/register", handleRegister)

    // Protected API Group
	api := r.Group("/api")
	api.Use(AuthMiddleware())
	{
		api.GET("/stats", handleStats)
		api.POST("/analyze", handleAnalyze)
		api.GET("/logs", func(c *gin.Context) {
			var userLogs []internal.ScanLog
			uid, _ := c.Get("userID")
			db.Where("user_id = ?", uid).Order("timestamp desc").Find(&userLogs)
			c.JSON(200, userLogs)
		})
	}

	r.Run(":8080")
}