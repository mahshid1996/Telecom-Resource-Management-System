package config

import "os"

type Config struct {
	Port     string
	MongoURI string
	MongoDB  string
}

func Load() Config {
	return Config{
		Port:     getEnv("PORT", "3035"),
		MongoURI: getEnv("MONGO_URI", "mongodb://localhost:27017"),
		MongoDB:  getEnv("MONGO_DB", "resourceDB"),
	}
}

func getEnv(key, defaultVal string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return defaultVal
}
