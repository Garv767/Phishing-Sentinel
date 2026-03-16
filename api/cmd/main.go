package main

import (
	"fmt" // Added for clearer debug printing
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"gorm.io/gorm"

	"phishing-sentinel/internal"
)

var (
	db         *gorm.DB
	JWT_SECRET []byte
)

type Claims struct {
	UserID uint `json:"user_id"`
	jwt.RegisteredClaims
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			fmt.Println("DEBUG [Auth]: Missing Authorization Header")
			c.AbortWithStatusJSON(401, gin.H{"error": "Authorization header required"})
			return
		}

		bearerToken := strings.Split(authHeader, " ")
		if len(bearerToken) != 2 || bearerToken[0] != "Bearer" {
			fmt.Printf("DEBUG [Auth]: Invalid Format. Header: %s\n", authHeader)
			c.AbortWithStatusJSON(401, gin.H{"error": "Invalid token format"})
			return
		}

		tokenString := bearerToken[1]
		claims := &Claims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return JWT_SECRET, nil
		})

		if err != nil {
			fmt.Printf("DEBUG [Auth]: JWT Parsing Error: %v\n", err)
			c.AbortWithStatusJSON(401, gin.H{"error": "Invalid or expired token", "details": err.Error()})
			return
		}

		if !token.Valid {
			fmt.Println("DEBUG [Auth]: Token is parsed but invalid")
			c.AbortWithStatusJSON(401, gin.H{"error": "Invalid token"})
			return
		}

		fmt.Printf("DEBUG [Auth]: Success! UserID: %d authenticated\n", claims.UserID)
		c.Set("userID", claims.UserID)
		c.Next()
	}
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
		fmt.Printf("DEBUG [Login]: User not found: %s\n", loginReq.Email)
		c.JSON(401, gin.H{"error": "User not found"})
		return
	}

	if user.Password != loginReq.Password {
		fmt.Printf("DEBUG [Login]: Wrong password for user: %s\n", loginReq.Email)
		c.JSON(401, gin.H{"error": "Wrong password"})
		return
	}

	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID: user.ID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(JWT_SECRET)
	if err != nil {
		fmt.Printf("DEBUG [Login]: Error signing token: %v\n", err)
	}

	fmt.Printf("DEBUG [Login]: Token generated for User %d\n", user.ID)
	c.JSON(200, gin.H{"token": tokenString})
}

// ... rest of your handleStats and handleAnalyze remain the same ...

func main() {
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("Note: .env file not loaded (standard for production)")
	}

	dsn := os.Getenv("DATABASE_URI")
	secret := os.Getenv("JWT_SECRET")

	if dsn == "" || secret == "" {
		log.Fatalf("CRITICAL: DATABASE_URI is set: %v, JWT_SECRET is set: %v", dsn != "", secret != "")
	}

	JWT_SECRET = []byte(secret)
	fmt.Printf("DEBUG [Main]: JWT_SECRET loaded. Length: %d bytes\n", len(JWT_SECRET))

	db = internal.InitDB(dsn)

	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			fmt.Printf("DEBUG [CORS]: Handling OPTIONS for %s\n", c.Request.URL.Path)
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	r.POST("/login", handleLogin)
	r.POST("/register", handleRegister)

	api := r.Group("/api")
	api.Use(AuthMiddleware())
	{
		api.GET("/stats", handleStats)
		api.POST("/analyze", handleAnalyze)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("SENTINEL ONLINE: Port %s", port)
	r.Run(":" + port)
}