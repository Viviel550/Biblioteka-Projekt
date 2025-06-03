import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # JWT Secret Key
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-default-secret-key')
    
    # Database credentials
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_NAME = os.getenv('DB_NAME', 'postgres')
    DB_USER = os.getenv('DB_USER', 'postgres')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'password')
    
    @staticmethod
    def get_db_connection_params():
        print("Using database connection parameters:")
        print(f"Host: {Config.DB_HOST}, Database: {Config.DB_NAME}, User: {Config.DB_USER}")
        return {
            'host': Config.DB_HOST,
            'dbname': Config.DB_NAME,
            'user': Config.DB_USER,
            'password': Config.DB_PASSWORD
        }